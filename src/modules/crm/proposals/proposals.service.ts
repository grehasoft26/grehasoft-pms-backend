import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProposalsRepository } from './proposals.repository';
import { OpportunitiesRepository } from '../opportunities/opportunities.repository';
import { LeadsRepository } from '../leads/leads.repository';
import { CreateProposalDto, UpdateProposalDto, ProposalFilterDto, CreateProposalTemplateDto, UpdateProposalTemplateDto, SubmitProposalApprovalDto, ReviewProposalApprovalDto } from './dto/proposals.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { ClientsService } from '../../clients/clients/clients.service';
import { STORAGE_PROVIDER_TOKEN } from '../../../shared/storage/storage.interface';
import type { IStorageProvider } from '../../../shared/storage/storage.interface';
import { PDF_PROVIDER_TOKEN } from '../../../shared/pdf/pdf.interface';
import type { IPdfProvider } from '../../../shared/pdf/pdf.interface';
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
    private readonly pdfProvider: IPdfProvider
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
      throw new NotFoundException(`Opportunity with ID ${dto.opportunityId} not found`);
    }

    const { subtotal, discountTotal, taxTotal, total, calculatedItems } = this.calculateProposalTotals(dto.items);

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
    this.logger.audit(context.userId, 'Delete Proposal', 'proposal', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }

  // PDF Generation with Checksum & Versioning
  async generatePdf(id: string, context: RequestContext) {
    const proposal = await this.getById(id);

    // Formulate PDF content text
    const title = `PROPOSAL: ${proposal.title}`;
    let content = `Proposal Number: ${proposal.proposalNumber}\n`;
    content += `Opportunity Name: ${proposal.opportunity.name}\n`;
    content += `Valid Until: ${proposal.validUntil.toDateString()}\n`;
    content += `Currency: ${proposal.currency}\n\n`;

    content += `LINE ITEMS:\n`;
    proposal.items.forEach((item: any, index: number) => {
      content += `${index + 1}. ${item.productName} | Qty: ${item.quantity} | Price: ${item.price} | Disc: ${item.discount} | Tax: ${item.tax}% | Total: ${item.total}\n`;
    });

    content += `\nSubtotal: ${proposal.subtotal}\n`;
    content += `Discount: ${proposal.discountTotal}\n`;
    content += `Tax: ${proposal.taxTotal}\n`;
    content += `GRAND TOTAL: ${proposal.total}\n`;

    const pdfBuffer = await this.pdfProvider.generatePdf(title, content, {
      proposalNumber: proposal.proposalNumber,
      currency: proposal.currency,
      total: proposal.total,
    });

    // Calculate metadata
    const fileSize = pdfBuffer.length;
    const checksum = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    const versionNumber = (proposal.pdfVersion || 0) + 1;

    // Upload PDF to local storage
    const fileKey = await this.storageProvider.uploadFile(
      pdfBuffer,
      `proposal_${proposal.proposalNumber}_v${versionNumber}.pdf`,
      'application/pdf',
      `proposals/${proposal.id}`
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
    this.logger.audit(context.userId, 'Generate Proposal PDF', 'proposal', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: updated,
    });

    return updated;
  }

  async getFileStream(id: string) {
    const proposal = await this.getById(id);
    if (!proposal.pdfFileKey) {
      throw new BadRequestException('No PDF generated yet for this proposal');
    }
    return this.storageProvider.getFileStream(proposal.pdfFileKey);
  }

  // Multi-Level Proposal Approvals
  async submitApproval(id: string, dto: SubmitProposalApprovalDto, context: RequestContext) {
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

  async reviewApproval(approvalId: string, dto: ReviewProposalApprovalDto, context: RequestContext) {
    const approval = await this.repository.findApprovalById(approvalId);
    if (!approval) {
      throw new NotFoundException(`Proposal approval with ID ${approvalId} not found`);
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
    this.logger.audit(context.userId, 'Proposal Approval Review', 'proposalApproval', updatedApproval, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: updatedApproval,
    });

    return updatedApproval;
  }

  // Client Conversion (Lead -> Opportunity -> Proposal Accepted -> Client)
  async convertToClient(opportunityId: string, clientCategoryId: string, context: RequestContext) {
    const opp = await this.opportunitiesRepository.findById(opportunityId);
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${opportunityId} not found`);
    }

    if (opp.clientId) {
      throw new BadRequestException('Opportunity already converted into a Client');
    }

    // Verify opportunity has an ACCEPTED proposal
    const hasAcceptedProposal = opp.proposals.some((p: any) => p.status === ProposalStatus.ACCEPTED);
    if (!hasAcceptedProposal) {
      throw new BadRequestException('Opportunity must have at least one ACCEPTED proposal to convert to Client');
    }

    // Ensure we have lead information
    if (!opp.leadId) {
      throw new BadRequestException('Opportunity must be linked to a Lead to perform Client conversion');
    }

    const lead = await this.leadsRepository.findById(opp.leadId);
    if (!lead) {
      throw new NotFoundException(`Associated Lead with ID ${opp.leadId} not found`);
    }

    // Create Client in existing Client Module
    // Build payload matching Sprint 4 ClientsService.create:
    // CreateClientDto has: name, categoryId, industry, companyType, website, gstVatNumber, taxNumber, registrationNumber, remarks
    const client = await this.clientsService.create({
      name: lead.companyName,
      categoryId: clientCategoryId,
      industry: 'Other',
      companyType: 'Inc',
      website: lead.website || undefined,
      gstVatNumber: lead.gstNumber || undefined,
      remarks: lead.remarks || 'Converted from Lead & Opportunity',
    }, context);

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

    // Update Opportunity with converted Client reference & Closed Won stage
    const closedWonStage = await this.opportunitiesRepository.prisma.pipelineStage.findFirst({
      where: { code: 'CLOSED_WON' },
    });

    const updatedOpp = await this.opportunitiesRepository.update(opp.id, {
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
    this.logger.audit(context.userId, 'Convert Opportunity to Client', 'client', client, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: opp,
      after: client,
    });

    return client;
  }

  // Proposal Templates
  async createTemplate(dto: CreateProposalTemplateDto, context: RequestContext) {
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
}
