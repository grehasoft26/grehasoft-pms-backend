import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProposalsRepository } from './proposals.repository';
import { OpportunitiesRepository } from '../opportunities/opportunities.repository';
import { LeadsRepository } from '../leads/leads.repository';
import {
  CreateProposalDto,
  UpdateProposalDto,
  ProposalFilterDto,
  CreateProposalTemplateDto,
  UpdateProposalTemplateDto,
  SubmitProposalApprovalDto,
  ReviewProposalApprovalDto,
} from './dto/proposals.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { ClientsService } from '../../clients/clients/clients.service';
import { STORAGE_PROVIDER_TOKEN } from '../../../shared/storage/storage.interface';
import type { IStorageProvider } from '../../../shared/storage/storage.interface';
import { PDF_PROVIDER_TOKEN } from '../../../shared/pdf/pdf.interface';
import type { IPdfProvider } from '../../../shared/pdf/pdf.interface';
import { MAIL_PROVIDER_TOKEN } from '../../../shared/mail/mail.interface';
import type { IMailProvider } from '../../../shared/mail/mail.interface';
import { ProposalStatus, ApprovalStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ProposalsService {
  constructor(
    private readonly repository: ProposalsRepository,
    private readonly opportunitiesRepository: OpportunitiesRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly logger: LoggerService,
    private readonly clientsService: ClientsService,
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storageProvider: IStorageProvider,
    @Inject(PDF_PROVIDER_TOKEN)
    private readonly pdfProvider: IPdfProvider,
    @Inject(MAIL_PROVIDER_TOKEN)
    private readonly mailProvider: IMailProvider,
  ) {}

  private calculateProposalTotals(items: any[]): {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    total: number;
    calculatedItems: any[];
  } {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let total = 0;

    const calculatedItems = (items || []).map((item) => {
      const qty = item.quantity || 1;
      const price = Number(item.price || 0);
      const discount = Number(item.discount || 0);
      const taxPercent = Number(item.tax || 0);

      const itemSubtotal = qty * price;
      const itemTaxable = Math.max(0, itemSubtotal - discount);
      const itemTax = itemTaxable * (taxPercent / 100);
      const itemTotal = itemTaxable + itemTax;

      subtotal += itemSubtotal;
      discountTotal += discount;
      taxTotal += itemTax;
      total += itemTotal;

      return {
        productName: item.productName,
        quantity: qty,
        price,
        discount,
        tax: taxPercent,
        total: itemTotal,
      };
    });

    return { subtotal, discountTotal, taxTotal, total, calculatedItems };
  }

  async create(dto: CreateProposalDto, context: RequestContext) {
    const opp = await this.opportunitiesRepository.findById(dto.opportunityId);
    if (!opp) {
      throw new NotFoundException(
        `Opportunity with ID ${dto.opportunityId} not found`,
      );
    }

    const { subtotal, discountTotal, taxTotal, total, calculatedItems } =
      this.calculateProposalTotals(dto.items);

    const proposalNumber = await this.repository.generateProposalNumber();
    const validUntil = new Date(dto.validUntil);

    const proposal = await this.repository.create({
      opportunityId: dto.opportunityId,
      title: dto.title,
      proposalNumber,
      status: ProposalStatus.DRAFT,
      subtotal,
      discountTotal,
      taxTotal,
      total,
      currency: dto.currency || 'INR',
      validUntil,
      templateId: dto.templateId,
      builderConfig: dto.builderConfig || undefined,
      createdBy: context.userId,
    });

    for (const item of calculatedItems) {
      await this.repository.createProposalItem({
        ...item,
        proposalId: proposal.id,
      });
    }

    // Add opportunity timeline event
    await this.opportunitiesRepository.createTimeline({
      opportunityId: dto.opportunityId,
      event: 'PROPOSAL_CREATED',
      description: `Proposal "${dto.title}" (${proposalNumber}) created.`,
      createdBy: context.userId,
      metadata: { proposalId: proposal.id },
    });

    // Audit
    this.logger.audit(context.userId, 'Create Proposal', 'proposal', proposal, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: proposal,
    });

    return this.getById(proposal.id);
  }

  async getMany(filters: ProposalFilterDto) {
    return this.repository.findMany(filters);
  }

  async getById(id: string) {
    const prop = await this.repository.findById(id);
    if (!prop) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }
    return prop;
  }

  async update(id: string, dto: UpdateProposalDto, context: RequestContext) {
    const before = await this.getById(id);

    let subtotal = Number(before.subtotal);
    let discountTotal = Number(before.discountTotal);
    let taxTotal = Number(before.taxTotal);
    let total = Number(before.total);
    let calculatedItems = before.items;

    if (dto.items) {
      const calculation = this.calculateProposalTotals(dto.items);
      subtotal = calculation.subtotal;
      discountTotal = calculation.discountTotal;
      taxTotal = calculation.taxTotal;
      total = calculation.total;
      calculatedItems = calculation.calculatedItems;

      await this.repository.deleteProposalItems(id);
      for (const item of calculatedItems) {
        await this.repository.createProposalItem({
          ...item,
          proposalId: id,
        });
      }
    }

    const validUntil = dto.validUntil ? new Date(dto.validUntil) : undefined;

    const updated = await this.repository.update(id, {
      title: dto.title,
      validUntil,
      templateId: dto.templateId,
      currency: dto.currency,
      status: dto.status,
      subtotal,
      discountTotal,
      taxTotal,
      total,
      builderConfig: dto.builderConfig,
      updatedBy: context.userId,
    });

    // Log Opportunity timeline
    await this.opportunitiesRepository.createTimeline({
      opportunityId: before.opportunityId,
      event: 'PROPOSAL_UPDATED',
      description: `Proposal "${updated.title}" was updated.`,
      createdBy: context.userId,
      metadata: { before, after: updated },
    });

    // Audit
    this.logger.audit(context.userId, 'Update Proposal', 'proposal', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
      after: updated,
    });

    return this.getById(id);
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id, context.userId);

    // Audit
    this.logger.audit(
      context.userId,
      'Delete Proposal',
      'proposal',
      { id },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before,
      },
    );
  }

  // PDF Generation with Checksum & Versioning
  async generatePdf(id: string, context: RequestContext) {
    const proposal = await this.getById(id);

    // Resolve placeholder values
    let clientName = '';
    let companyName = '';
    if (proposal.opportunity.client) {
      clientName =
        proposal.opportunity.client.primaryContact?.name ||
        proposal.opportunity.client.name;
      companyName = proposal.opportunity.client.name || '';
    } else if (proposal.opportunity.lead) {
      clientName = proposal.opportunity.lead.contactName || '';
      companyName = proposal.opportunity.lead.companyName || '';
    }

    const projectName = proposal.opportunity.name || '';
    const proposalTitle = proposal.title || '';

    // Interpolation engine
    const interpolatePlaceholders = (text: string) => {
      if (!text) return '';
      return text
        .replace(/{client_name}/g, clientName)
        .replace(/{company_name}/g, companyName)
        .replace(/{project_name}/g, projectName)
        .replace(/{proposal_title}/g, proposalTitle);
    };

    // Determine cover letter: priority sequence is builderConfig -> template -> default fallback
    const config = (proposal.builderConfig as any) || {};
    let coverLetterRaw = config.cover_letter || '';
    if (!coverLetterRaw && proposal.template) {
      coverLetterRaw = proposal.template.content || '';
    }
    const coverLetter = interpolatePlaceholders(coverLetterRaw);

    const title = `PROPOSAL: ${proposal.title}`;

    // Generate PDF via PdfKitProvider
    const pdfBuffer = await this.pdfProvider.generatePdf(title, coverLetter, {
      builderConfig: config,
      items: proposal.items,
      client: { name: clientName, companyName: companyName },
      proposal: {
        proposalNumber: proposal.proposalNumber,
        currency: proposal.currency,
        subtotal: Number(proposal.subtotal),
        discountTotal: Number(proposal.discountTotal),
        taxTotal: Number(proposal.taxTotal),
        total: Number(proposal.total),
        projectOverview: config.project_overview || '',
        description: proposal.opportunity.lead?.clientRequirements || '',
      },
      coverLetter,
    });

    const content =
      `Proposal Number: ${proposal.proposalNumber}\n` +
      `Opportunity Name: ${proposal.opportunity.name}\n` +
      `Valid Until: ${proposal.validUntil.toDateString()}\n` +
      `Currency: ${proposal.currency}\n\n` +
      `Subtotal: ${proposal.subtotal}\n` +
      `Discount: ${proposal.discountTotal}\n` +
      `Tax: ${proposal.taxTotal}\n` +
      `GRAND TOTAL: ${proposal.total}\n`;

    // Calculate metadata
    const fileSize = pdfBuffer.length;
    const checksum = crypto
      .createHash('sha256')
      .update(pdfBuffer)
      .digest('hex');
    const versionNumber = (proposal.pdfVersion || 0) + 1;

    // Upload PDF to local storage
    const fileKey = await this.storageProvider.uploadFile(
      pdfBuffer,
      `proposal_${proposal.proposalNumber}_v${versionNumber}.pdf`,
      'application/pdf',
      `proposals/${proposal.id}`,
    );

    // Update Proposal with PDF Metadata
    const updated = await this.repository.update(proposal.id, {
      pdfFileKey: fileKey,
      pdfGeneratedAt: new Date(),
      pdfGeneratedBy: context.userId,
      pdfVersion: versionNumber,
      pdfFileSize: fileSize,
      pdfChecksum: checksum,
      currentVersion: versionNumber,
    });

    // Create a Version snapshot
    await this.repository.createVersion({
      proposalId: proposal.id,
      versionNumber,
      title: proposal.title,
      subtotal: proposal.subtotal,
      discountTotal: proposal.discountTotal,
      taxTotal: proposal.taxTotal,
      total: proposal.total,
      content,
      pdfFileKey: fileKey,
      createdBy: context.userId,
    });

    // Log Opportunity timeline
    await this.opportunitiesRepository.createTimeline({
      opportunityId: proposal.opportunityId,
      event: 'PROPOSAL_PDF_GENERATED',
      description: `PDF generated for Proposal ${proposal.proposalNumber} (Version ${versionNumber}).`,
      createdBy: context.userId,
    });

    // Audit
    this.logger.audit(
      context.userId,
      'Generate Proposal PDF',
      'proposal',
      updated,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: updated,
      },
    );

    return updated;
  }

  async getFileStream(id: string, versionId?: string) {
    if (versionId) {
      const version = await this.repository.prisma.proposalVersion.findUnique({
        where: { id: versionId },
      });
      if (!version || !version.pdfFileKey) {
        throw new NotFoundException('Requested PDF version is not available');
      }
      return this.storageProvider.getFileStream(version.pdfFileKey);
    }
    const proposal = await this.getById(id);
    if (!proposal.pdfFileKey) {
      throw new BadRequestException('No PDF generated yet for this proposal');
    }
    return this.storageProvider.getFileStream(proposal.pdfFileKey);
  }

  // Multi-Level Proposal Approvals
  async submitApproval(
    id: string,
    dto: SubmitProposalApprovalDto,
    context: RequestContext,
  ) {
    const proposal = await this.getById(id);

    const approval = await this.repository.createApproval({
      proposalId: id,
      approverId: dto.approverId,
      level: dto.level || 1,
      status: ApprovalStatus.PENDING,
    });

    // Log timeline
    await this.opportunitiesRepository.createTimeline({
      opportunityId: proposal.opportunityId,
      event: 'PROPOSAL_SUBMITTED_FOR_APPROVAL',
      description: `Proposal was submitted for Level ${dto.level || 1} approval.`,
      createdBy: context.userId,
    });

    return approval;
  }

  async reviewApproval(
    approvalId: string,
    dto: ReviewProposalApprovalDto,
    context: RequestContext,
  ) {
    const approval = await this.repository.findApprovalById(approvalId);
    if (!approval) {
      throw new NotFoundException(
        `Proposal approval with ID ${approvalId} not found`,
      );
    }

    const updatedApproval = await this.repository.updateApproval(approvalId, {
      status: dto.status,
      comments: dto.comments,
      reviewedAt: new Date(),
    });

    const proposal = await this.getById(approval.proposalId);

    // If rejected, reject proposal
    if (dto.status === ApprovalStatus.REJECTED) {
      await this.repository.update(proposal.id, {
        status: ProposalStatus.REJECTED,
      });

      await this.opportunitiesRepository.createTimeline({
        opportunityId: proposal.opportunityId,
        event: 'PROPOSAL_REJECTED',
        description: `Proposal was rejected at Level ${approval.level}.`,
        createdBy: context.userId,
      });
    } else if (dto.status === ApprovalStatus.APPROVED) {
      // Check if all approvals at this or lower levels are approved.
      // For simplicity, if this level is approved, we mark proposal as APPROVED/SENT or if it's the final level, ACCEPTED.
      // Let's check if there are other pending approvals.
      const pending = await this.repository.prisma.proposalApproval.count({
        where: {
          proposalId: proposal.id,
          status: ApprovalStatus.PENDING,
        },
      });

      if (pending === 0) {
        await this.repository.update(proposal.id, {
          status: ProposalStatus.ACCEPTED,
        });

        await this.opportunitiesRepository.createTimeline({
          opportunityId: proposal.opportunityId,
          event: 'PROPOSAL_ACCEPTED',
          description: `Proposal accepted after all approval levels cleared.`,
          createdBy: context.userId,
        });
      }
    }

    // Audit Log
    this.logger.audit(
      context.userId,
      'Proposal Approval Review',
      'proposalApproval',
      updatedApproval,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: updatedApproval,
      },
    );

    return updatedApproval;
  }

  // Client Conversion (Lead -> Opportunity -> Proposal Accepted -> Client)
  async convertToClient(
    opportunityId: string,
    clientCategoryId: string,
    context: RequestContext,
  ) {
    const opp = await this.opportunitiesRepository.findById(opportunityId);
    if (!opp) {
      throw new NotFoundException(
        `Opportunity with ID ${opportunityId} not found`,
      );
    }

    if (opp.clientId) {
      throw new BadRequestException(
        'Opportunity already converted into a Client',
      );
    }

    // Verify opportunity has an ACCEPTED proposal
    const hasAcceptedProposal = opp.proposals.some(
      (p: any) => p.status === ProposalStatus.ACCEPTED,
    );
    if (!hasAcceptedProposal) {
      throw new BadRequestException(
        'Opportunity must have at least one ACCEPTED proposal to convert to Client',
      );
    }

    // Ensure we have lead information
    if (!opp.leadId) {
      throw new BadRequestException(
        'Opportunity must be linked to a Lead to perform Client conversion',
      );
    }

    const lead = await this.leadsRepository.findById(opp.leadId);
    if (!lead) {
      throw new NotFoundException(
        `Associated Lead with ID ${opp.leadId} not found`,
      );
    }

    // Create Client in existing Client Module
    // Build payload matching Sprint 4 ClientsService.create:
    // CreateClientDto has: name, categoryId, industry, companyType, website, gstVatNumber, taxNumber, registrationNumber, remarks
    const client = await this.clientsService.create(
      {
        name: lead.companyName,
        categoryId: clientCategoryId,
        industry: 'Other',
        companyType: 'Inc',
        website: lead.website || undefined,
        gstVatNumber: lead.gstNumber || undefined,
        remarks: lead.remarks || 'Converted from Lead & Opportunity',
      },
      context,
    );

    // Link client contact details if present
    // Let's create a ClientContact in client module
    await this.repository.prisma.clientContact.create({
      data: {
        clientId: client.id,
        name: lead.contactName,
        email: lead.email,
        mobile: lead.phone,
        isPrimary: true,
      },
    });

    if (lead.addressLine1 || lead.city || lead.country) {
      const address = await this.repository.prisma.clientAddress.create({
        data: {
          clientId: client.id,
          type: 'BILLING',
          addressLine1: lead.addressLine1 || '',
          addressLine2: lead.addressLine2 || null,
          city: lead.city || '',
          state: lead.state || null,
          postalCode: lead.postalCode || '',
          country: lead.country || '',
          isPrimary: true,
        },
      });
      await this.repository.prisma.client.update({
        where: { id: client.id },
        data: { primaryAddressId: address.id },
      });
    }

    // Update Opportunity with converted Client reference & Closed Won stage
    const closedWonStage =
      await this.opportunitiesRepository.prisma.pipelineStage.findFirst({
        where: { code: 'CLOSED_WON' },
      });

    await this.opportunitiesRepository.update(opp.id, {
      clientId: client.id,
      stageId: closedWonStage ? closedWonStage.id : opp.stageId,
      probability: 100,
      updatedBy: context.userId,
    });

    // Update Lead status to Won
    const wonStatus = await this.leadsRepository.prisma.leadStatus.findFirst({
      where: { code: 'WON' },
    });
    if (wonStatus) {
      await this.leadsRepository.update(lead.id, {
        statusId: wonStatus.id,
        updatedBy: context.userId,
      });
    }

    // Log Opportunity timeline
    await this.opportunitiesRepository.createTimeline({
      opportunityId: opp.id,
      event: 'CLIENT_CONVERTED',
      description: `Opportunity successfully converted into Client: "${client.name}".`,
      createdBy: context.userId,
      metadata: { clientId: client.id },
    });

    // Log Lead timeline
    await this.leadsRepository.createTimeline({
      leadId: lead.id,
      event: 'LEAD_WON',
      description: `Lead closed won and client generated.`,
      createdBy: context.userId,
    });

    // Audit Log
    this.logger.audit(
      context.userId,
      'Convert Opportunity to Client',
      'client',
      client,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before: opp,
        after: client,
      },
    );

    return client;
  }

  // Proposal Templates
  async createTemplate(
    dto: CreateProposalTemplateDto,
    context: RequestContext,
  ) {
    return this.repository.createTemplate({
      ...dto,
      createdBy: context.userId,
    });
  }

  async getTemplates() {
    return this.repository.getTemplates();
  }

  async getTemplateById(id: string) {
    const templ = await this.repository.getTemplateById(id);
    if (!templ) throw new NotFoundException('Template not found');
    return templ;
  }

  async updateTemplate(
    id: string,
    dto: UpdateProposalTemplateDto,
    context: RequestContext,
  ) {
    await this.getTemplateById(id);
    return this.repository.updateTemplate(id, {
      name: dto.name,
      subject: dto.subject,
      content: dto.content,
      updatedBy: context.userId,
    });
  }

  async deleteTemplate(id: string, context: RequestContext) {
    await this.getTemplateById(id);
    return this.repository.deleteTemplate(id, context.userId);
  }

  async getFileStreamPublic(id: string, token: string) {
    const proposal = await this.getById(id);
    if (!proposal.pdfFileKey) {
      throw new BadRequestException('No PDF generated yet for this proposal');
    }

    // Validate secure token
    const secret = 'grehasoft_proposal_secret_key';
    if (!token) {
      throw new BadRequestException('Missing secure access token');
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Malformed secure access token');
    }

    const [sig, ts] = parts;
    const diff = Date.now() - Number(ts);
    if (diff > 172800 * 1000) {
      // 2 days expiration
      throw new BadRequestException('Secure access token has expired');
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${id}:${ts}`)
      .digest('hex');
    if (sig !== expectedSig) {
      throw new BadRequestException('Invalid secure access token signature');
    }

    return this.storageProvider.getFileStream(proposal.pdfFileKey);
  }

  async send(
    id: string,
    dto: { email?: string; subject?: string; message?: string },
    context: RequestContext,
  ) {
    const proposal = await this.getById(id);

    // 1. Generate final PDF to ensure S3/Local Storage is populated
    await this.generatePdf(id, context);

    // Refresh to get updated pdfFileKey
    const updatedProp = await this.getById(id);
    if (!updatedProp.pdfFileKey) {
      throw new BadRequestException('Failed to generate PDF for sending');
    }

    // 2. Validate recipient
    let recipientEmail = dto.email;
    if (!recipientEmail) {
      recipientEmail =
        updatedProp.opportunity.lead?.email ||
        (updatedProp.opportunity.client as any)?.primaryContact?.email;
    }
    if (!recipientEmail) {
      throw new BadRequestException('Recipient email address is required');
    }

    // 3. Generate secure download link
    const secret = 'grehasoft_proposal_secret_key';
    const timestamp = Date.now();
    const token =
      crypto
        .createHmac('sha256', secret)
        .update(`${id}:${timestamp}`)
        .digest('hex') + `.${timestamp}`;

    const siteUrl = process.env.VITE_API_URL || 'http://127.0.0.1:3000/api/v1';
    const secureLink = `${siteUrl}/public/proposals/${id}/pdf/download?token=${token}`;

    // 4. Send Email via MailProvider
    const subject = dto.subject || `Proposal: ${updatedProp.title}`;
    let emailHtml =
      dto.message ||
      `Dear Client,<br/><br/>Please find attached the proposal for <b>${updatedProp.title}</b>.<br/><br/>`;
    emailHtml += `You can also securely download it using this link (expires in 2 days):<br/>`;
    emailHtml += `<a href="${secureLink}" target="_blank">${secureLink}</a><br/><br/>`;
    emailHtml += `Best regards,<br/>Grehasoft Team`;

    // Fetch pdf buffer from storage to attach it
    const fileStream = await this.storageProvider.getFileStream(
      updatedProp.pdfFileKey,
    );
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    await this.mailProvider.sendMail(recipientEmail, subject, emailHtml, [
      {
        filename: `proposal_${updatedProp.proposalNumber}.pdf`,
        content: pdfBuffer,
      },
    ]);

    // 5. Update status to SENT
    await this.repository.update(id, {
      status: ProposalStatus.SENT,
    });

    // 6. Log Opportunity timeline event
    await this.opportunitiesRepository.createTimeline({
      opportunityId: updatedProp.opportunityId,
      event: 'PROPOSAL_SENT',
      description: `Proposal quote sent to ${recipientEmail} with secure attachment.`,
      createdBy: context.userId,
    });

    return { success: true };
  }

  async previewPdf(body: any, isPreview: boolean = true) {
    let clientName = '';
    let companyName = '';
    let projectName = body.title || 'Project';

    if (body.opportunityId) {
      const opp = await this.opportunitiesRepository.findById(
        body.opportunityId,
      );
      if (opp) {
        projectName = opp.name;
        if (opp.client) {
          clientName =
            (opp.client as any).primaryContact?.name || opp.client.name || '';
          companyName = opp.client.name || '';
        } else if (opp.lead) {
          clientName = opp.lead.contactName || '';
          companyName = opp.lead.companyName || '';
        }
      }
    }

    const interpolatePlaceholders = (text: string) => {
      if (!text) return '';
      return text
        .replace(/{client_name}/g, clientName)
        .replace(/{company_name}/g, companyName)
        .replace(/{project_name}/g, projectName)
        .replace(/{proposal_title}/g, body.title || '');
    };

    const config = body.builderConfig || {};
    let coverLetterRaw = config.cover_letter || '';
    if (!coverLetterRaw && body.templateId) {
      const templ = await this.repository.getTemplateById(body.templateId);
      if (templ) {
        coverLetterRaw = templ.content || '';
      }
    }
    const coverLetter = interpolatePlaceholders(coverLetterRaw);

    const title = isPreview ? `PREVIEW: ${body.title || 'Proposal'}` : (body.title || 'Proposal');
    const totals = this.calculateProposalTotals(body.items || []);

    const pdfBuffer = await this.pdfProvider.generatePdf(title, coverLetter, {
      builderConfig: config,
      items: body.items || [],
      client: { name: clientName, companyName: companyName },
      proposal: {
        proposalNumber: body.proposalNumber || 'PROP-PREVIEW',
        currency: body.currency || 'USD',
        subtotal: Number(totals.subtotal),
        discountTotal: Number(totals.discountTotal),
        taxTotal: Number(totals.taxTotal),
        total: Number(totals.total),
        projectOverview: config.project_overview || '',
      },
      coverLetter,
    });

    if (!isPreview) {
      console.log('[PDF DOWNLOAD] PDF generated');
      console.log('[PDF DOWNLOAD] Buffer size:', pdfBuffer.length);
    }

    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(pdfBuffer);
    stream.push(null);
    return stream;
  }
}
