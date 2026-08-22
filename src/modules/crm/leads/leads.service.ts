import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LeadsRepository } from './leads.repository';
import {
  CreateLeadDto,
  UpdateLeadDto,
  LeadFilterDto,
  AssignLeadDto,
  MergeLeadsDto,
} from './dto/leads.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  CreateLeadActivityDto,
  UpdateLeadActivityDto,
} from '../lead-activities/dto/lead-activities.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly repository: LeadsRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateLeadDto, context: RequestContext) {
    // 1. Create Lead
    const expectedClosingDate = dto.expectedClosingDate
      ? new Date(dto.expectedClosingDate)
      : undefined;
    const lead = await this.repository.create({
      ...dto,
      expectedClosingDate,
      createdBy: context.userId,
    });

    // 2. Log in timeline
    await this.repository.createTimeline({
      leadId: lead.id,
      event: 'LEAD_CREATED',
      description: `Lead for company "${dto.companyName}" was created.`,
      createdBy: context.userId,
      metadata: { lead },
    });

    // 3. Log Audit
    this.logger.audit(context.userId, 'Create Lead', 'lead', lead, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: lead,
    });

    return lead;
  }

  async getMany(filters: LeadFilterDto) {
    return this.repository.findMany(filters);
  }

  async getById(id: string) {
    const lead = await this.repository.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, context: RequestContext) {
    const before = await this.getById(id);

    const expectedClosingDate = dto.expectedClosingDate
      ? new Date(dto.expectedClosingDate)
      : undefined;
    const updated = await this.repository.update(id, {
      ...dto,
      expectedClosingDate,
      updatedBy: context.userId,
    });

    // Log timeline
    await this.repository.createTimeline({
      leadId: id,
      event: 'LEAD_UPDATED',
      description: `Lead details were updated.`,
      createdBy: context.userId,
      metadata: { before, after: updated },
    });

    // Log Audit
    this.logger.audit(context.userId, 'Update Lead', 'lead', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
      after: updated,
    });

    return updated;
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id, context.userId);

    // Log timeline
    await this.repository.createTimeline({
      leadId: id,
      event: 'LEAD_DELETED',
      description: `Lead was soft-deleted.`,
      createdBy: context.userId,
    });

    // Log Audit
    this.logger.audit(
      context.userId,
      'Delete Lead',
      'lead',
      { id },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before,
      },
    );
  }

  async restore(id: string, context: RequestContext) {
    const restored = await this.repository.restore(id);

    // Log timeline
    await this.repository.createTimeline({
      leadId: id,
      event: 'LEAD_RESTORED',
      description: `Lead was restored.`,
      createdBy: context.userId,
    });

    // Log Audit
    this.logger.audit(context.userId, 'Restore Lead', 'lead', restored, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: restored,
    });

    return restored;
  }

  async assign(id: string, dto: AssignLeadDto, context: RequestContext) {
    const lead = await this.getById(id);
    const previousOwnerId = lead.ownerId;

    // Update owner in Lead
    const updated = await this.repository.update(id, {
      ownerId: dto.assigneeId,
      updatedBy: context.userId,
    });

    // Record assignment history
    const assignment = await this.repository.createAssignment({
      leadId: id,
      assigneeId: dto.assigneeId,
      assignedById: context.userId,
      notes: dto.notes,
      transferFromId:
        previousOwnerId !== dto.assigneeId ? previousOwnerId : null,
    });

    // Record timeline event
    await this.repository.createTimeline({
      leadId: id,
      event:
        previousOwnerId === dto.assigneeId
          ? 'LEAD_ASSIGNED'
          : 'LEAD_TRANSFERRED',
      description: `Lead ownership transferred to assignee ID: ${dto.assigneeId}.`,
      createdBy: context.userId,
      metadata: { assignment },
    });

    // Audit Log
    this.logger.audit(context.userId, 'Assign Lead', 'lead', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: lead,
      after: updated,
    });

    return updated;
  }

  async checkDuplicates(params: {
    email?: string;
    phone?: string;
    companyName?: string;
    gstNumber?: string;
    excludeId?: string;
  }) {
    return this.repository.checkDuplicates(params);
  }

  async merge(dto: MergeLeadsDto, context: RequestContext) {
    const primary = await this.getById(dto.primaryLeadId);
    const secondary = await this.getById(dto.secondaryLeadId);

    if (primary.id === secondary.id) {
      throw new BadRequestException('Cannot merge a lead with itself');
    }

    // 1. Copy missing fields from secondary to primary
    const updateData: any = {};
    if (!primary.phone && secondary.phone) updateData.phone = secondary.phone;
    if (!primary.website && secondary.website)
      updateData.website = secondary.website;
    if (!primary.gstNumber && secondary.gstNumber)
      updateData.gstNumber = secondary.gstNumber;
    if (!primary.expectedBudget && secondary.expectedBudget)
      updateData.expectedBudget = secondary.expectedBudget;
    if (!primary.expectedClosingDate && secondary.expectedClosingDate)
      updateData.expectedClosingDate = secondary.expectedClosingDate;
    if (!primary.remarks && secondary.remarks)
      updateData.remarks = secondary.remarks;

    let merged: any = primary;
    if (Object.keys(updateData).length > 0) {
      merged = await this.repository.update(primary.id, {
        ...updateData,
        updatedBy: context.userId,
      });
    }

    // 2. Transfer activities
    const activities = await this.repository.prisma.leadActivity.findMany({
      where: { leadId: secondary.id, deletedAt: null },
    });
    for (const act of activities) {
      await this.repository.prisma.leadActivity.update({
        where: { id: act.id },
        data: { leadId: primary.id },
      });
    }

    // 3. Transfer assignments
    const assignments = await this.repository.prisma.leadAssignment.findMany({
      where: { leadId: secondary.id },
    });
    for (const asn of assignments) {
      await this.repository.prisma.leadAssignment.update({
        where: { id: asn.id },
        data: { leadId: primary.id },
      });
    }

    // 4. Transfer timelines
    const timelines = await this.repository.prisma.leadTimeline.findMany({
      where: { leadId: secondary.id },
    });
    for (const tml of timelines) {
      await this.repository.prisma.leadTimeline.update({
        where: { id: tml.id },
        data: { leadId: primary.id },
      });
    }

    // 5. Transfer opportunities
    const opportunities = await this.repository.prisma.opportunity.findMany({
      where: { leadId: secondary.id },
    });
    for (const opp of opportunities) {
      await this.repository.prisma.opportunity.update({
        where: { id: opp.id },
        data: { leadId: primary.id },
      });
    }

    // 6. Delete secondary lead
    await this.repository.delete(secondary.id, context.userId);

    // 7. Write Timeline for Primary
    await this.repository.createTimeline({
      leadId: primary.id,
      event: 'LEAD_MERGED',
      description: `Lead "${secondary.companyName}" was merged into this lead.`,
      createdBy: context.userId,
      metadata: { mergedFrom: secondary },
    });

    // 8. Audit Log
    this.logger.audit(context.userId, 'Merge Leads', 'lead', merged, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: { primary, secondary },
      after: merged,
    });

    return merged;
  }

  // Lead Activities CRUD
  async createActivity(dto: CreateLeadActivityDto, context: RequestContext) {
    await this.getById(dto.leadId); // ensure lead exists

    const activityDate = dto.activityDate
      ? new Date(dto.activityDate)
      : undefined;
    const activity = await this.repository.createActivity({
      ...dto,
      activityDate,
      createdBy: context.userId,
    });

    // Log timeline
    await this.repository.createTimeline({
      leadId: dto.leadId,
      event: 'LEAD_ACTIVITY_CREATED',
      description: `Activity "${dto.title}" of type ${dto.type} recorded.`,
      createdBy: context.userId,
      metadata: { activity },
    });

    return activity;
  }

  async getActivities(leadId: string) {
    await this.getById(leadId);
    return this.repository.getActivities(leadId);
  }

  async updateActivity(
    id: string,
    dto: UpdateLeadActivityDto,
    context: RequestContext,
  ) {
    const before = await this.repository.findActivityById(id);
    if (!before) {
      throw new NotFoundException(`Lead activity with ID ${id} not found`);
    }

    const activityDate = dto.activityDate
      ? new Date(dto.activityDate)
      : undefined;
    const updated = await this.repository.updateActivity(id, {
      ...dto,
      activityDate,
      updatedBy: context.userId,
    });

    return updated;
  }

  async deleteActivity(id: string, context: RequestContext) {
    const before = await this.repository.findActivityById(id);
    if (!before) {
      throw new NotFoundException(`Lead activity with ID ${id} not found`);
    }

    await this.repository.deleteActivity(id, context.userId);
  }

  async getTimeline(leadId: string) {
    await this.getById(leadId);
    return this.repository.getTimeline(leadId);
  }
}
