import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OpportunitiesRepository } from './opportunities.repository';
import { LeadsRepository } from '../leads/leads.repository';
import { CreateOpportunityDto, UpdateOpportunityDto, OpportunityFilterDto, ConvertLeadDto } from './dto/opportunities.dto';
import { CreatePipelineDto, UpdatePipelineDto, CreatePipelineStageDto, UpdatePipelineStageDto } from './dto/pipelines.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly repository: OpportunitiesRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly logger: LoggerService
  ) {}

  private calculateItems(items: any[]): { calculatedItems: any[]; totalValue: number } {
    let totalValue = 0;
    const calculatedItems = (items || []).map((item) => {
      const quantity = item.quantity || 1;
      const price = Number(item.price || 0);
      const discount = Number(item.discount || 0);
      const taxPercent = Number(item.tax || 0);

      const subtotal = quantity * price;
      const taxableAmount = Math.max(0, subtotal - discount);
      const taxAmount = taxableAmount * (taxPercent / 100);
      const total = taxableAmount + taxAmount;

      totalValue += total;

      return {
        productName: item.productName,
        quantity,
        price,
        discount,
        tax: taxPercent,
        total,
      };
    });

    return { calculatedItems, totalValue };
  }

  async create(dto: CreateOpportunityDto, context: RequestContext) {
    const { calculatedItems, totalValue } = this.calculateItems(dto.items || []);
    const expectedCloseDate = new Date(dto.expectedCloseDate);

    // If items are provided, override value with computed total, else use manual value
    const finalValue = dto.items && dto.items.length > 0 ? totalValue : dto.value;

    const opportunity = await this.repository.create({
      leadId: dto.leadId,
      name: dto.name,
      value: finalValue,
      probability: dto.probability || 10,
      expectedCloseDate,
      stageId: dto.stageId,
      ownerId: dto.ownerId,
      competitors: dto.competitors,
      winReason: dto.winReason,
      lossReason: dto.lossReason,
      createdBy: context.userId,
    });

    // Save line items
    for (const item of calculatedItems) {
      await this.repository.createOpportunityItem({
        ...item,
        opportunityId: opportunity.id,
        createdBy: context.userId,
      });
    }

    // Add timeline event
    await this.repository.createTimeline({
      opportunityId: opportunity.id,
      event: 'OPPORTUNITY_CREATED',
      description: `Opportunity "${dto.name}" was created.`,
      createdBy: context.userId,
      metadata: { opportunity },
    });

    // Audit Log
    this.logger.audit(context.userId, 'Create Opportunity', 'opportunity', opportunity, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: opportunity,
    });

    return this.getById(opportunity.id);
  }

  async getMany(filters: OpportunityFilterDto) {
    return this.repository.findMany(filters);
  }

  async getById(id: string) {
    const opp = await this.repository.findById(id);
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }
    return opp;
  }

  async update(id: string, dto: UpdateOpportunityDto, context: RequestContext) {
    const before = await this.getById(id);

    let finalValue = dto.value !== undefined ? dto.value : Number(before.value);
    let calculatedItems: any[] = [];

    if (dto.items) {
      const calculation = this.calculateItems(dto.items);
      calculatedItems = calculation.calculatedItems;
      finalValue = calculation.totalValue;

      // Delete existing and insert new
      await this.repository.deleteOpportunityItems(id);
      for (const item of calculatedItems) {
        await this.repository.createOpportunityItem({
          ...item,
          opportunityId: id,
          createdBy: context.userId,
        });
      }
    }

    const expectedCloseDate = dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined;

    const updated = await this.repository.update(id, {
      leadId: dto.leadId,
      name: dto.name,
      value: finalValue,
      probability: dto.probability,
      expectedCloseDate,
      stageId: dto.stageId,
      ownerId: dto.ownerId,
      competitors: dto.competitors,
      winReason: dto.winReason,
      lossReason: dto.lossReason,
      updatedBy: context.userId,
    });

    // Log timeline
    await this.repository.createTimeline({
      opportunityId: id,
      event: 'OPPORTUNITY_UPDATED',
      description: `Opportunity was updated.`,
      createdBy: context.userId,
      metadata: { before, after: updated },
    });

    // Audit Log
    this.logger.audit(context.userId, 'Update Opportunity', 'opportunity', updated, {
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

    // Log timeline
    await this.repository.createTimeline({
      opportunityId: id,
      event: 'OPPORTUNITY_DELETED',
      description: `Opportunity was soft-deleted.`,
      createdBy: context.userId,
    });

    // Audit Log
    this.logger.audit(context.userId, 'Delete Opportunity', 'opportunity', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }

  async restore(id: string, context: RequestContext) {
    const restored = await this.repository.restore(id);

    // Log timeline
    await this.repository.createTimeline({
      opportunityId: id,
      event: 'OPPORTUNITY_RESTORED',
      description: `Opportunity was restored.`,
      createdBy: context.userId,
    });

    // Audit Log
    this.logger.audit(context.userId, 'Restore Opportunity', 'opportunity', restored, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: restored,
    });

    return restored;
  }

  async convertLead(dto: ConvertLeadDto, context: RequestContext) {
    const lead = await this.leadsRepository.findById(dto.leadId);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${dto.leadId} not found`);
    }

    // Calculate items and final value
    const { calculatedItems, totalValue } = this.calculateItems(dto.items || []);
    const expectedCloseDate = new Date(dto.expectedCloseDate);

    // If budget isn't explicitly set in lead, we calculate it from items
    const finalValue = dto.items && dto.items.length > 0 ? totalValue : Number(lead.expectedBudget || 0);

    // Create Opportunity
    const opportunity = await this.repository.create({
      leadId: lead.id,
      name: `${lead.companyName} - Opportunity`,
      value: finalValue,
      probability: 10, // Starting probability
      expectedCloseDate,
      stageId: dto.stageId,
      ownerId: dto.ownerId,
      createdBy: context.userId,
    });

    // Create line items
    for (const item of calculatedItems) {
      await this.repository.createOpportunityItem({
        ...item,
        opportunityId: opportunity.id,
        createdBy: context.userId,
      });
    }

    // Set lead status to Qualified code
    const qualifiedStatus = await this.leadsRepository.prisma.leadStatus.findFirst({
      where: { code: 'QUALIFIED' },
    });
    if (qualifiedStatus) {
      await this.leadsRepository.update(lead.id, {
        statusId: qualifiedStatus.id,
        updatedBy: context.userId,
      });
    }

    // Write Lead timeline
    await this.leadsRepository.createTimeline({
      leadId: lead.id,
      event: 'LEAD_CONVERTED_TO_OPPORTUNITY',
      description: `Lead converted to opportunity "${opportunity.name}".`,
      createdBy: context.userId,
      metadata: { opportunityId: opportunity.id },
    });

    // Write Opportunity timeline
    await this.repository.createTimeline({
      opportunityId: opportunity.id,
      event: 'OPPORTUNITY_CONVERTED_FROM_LEAD',
      description: `Opportunity created via lead conversion.`,
      createdBy: context.userId,
      metadata: { leadId: lead.id },
    });

    // Audit Log
    this.logger.audit(context.userId, 'Convert Lead to Opportunity', 'opportunity', opportunity, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: lead,
      after: opportunity,
    });

    return this.getById(opportunity.id);
  }

  // Pipeline Business Methods
  async createPipeline(dto: CreatePipelineDto, context: RequestContext) {
    const pipeline = await this.repository.createPipeline({
      ...dto,
      createdBy: context.userId,
    });
    return pipeline;
  }

  async getPipelines() {
    return this.repository.getPipelines();
  }

  async getPipelineById(id: string) {
    const pl = await this.repository.getPipelineById(id);
    if (!pl) throw new NotFoundException('Pipeline not found');
    return pl;
  }

  async createPipelineStage(dto: CreatePipelineStageDto, context: RequestContext) {
    const stage = await this.repository.createPipelineStage({
      ...dto,
      createdBy: context.userId,
    });
    return stage;
  }

  async getTimeline(oppId: string) {
    await this.getById(oppId);
    return this.repository.getTimeline(oppId);
  }
}
