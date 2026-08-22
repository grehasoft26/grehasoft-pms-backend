import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { OpportunityFilterDto } from './dto/opportunities.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OpportunitiesRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.OpportunityUncheckedCreateInput) {
    return this.prisma.opportunity.create({
      data,
      include: {
        stage: { include: { pipeline: true } },
        owner: { select: { firstName: true, lastName: true, email: true } },
        lead: true,
        items: true,
      },
    });
  }

  async findMany(filters: OpportunityFilterDto) {
    const where: Prisma.OpportunityWhereInput = {};

    if (filters.isDeleted === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { competitors: { contains: filters.search } },
        { winReason: { contains: filters.search } },
        { lossReason: { contains: filters.search } },
      ];
    }

    if (filters.stageId) where.stageId = filters.stageId;
    if (filters.ownerId) where.ownerId = filters.ownerId;

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          stage: { include: { pipeline: true } },
          owner: { select: { firstName: true, lastName: true, email: true } },
          lead: true,
          items: true,
        },
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return { data, totalCount };
  }

  async findById(id: string) {
    return this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        stage: { include: { pipeline: true } },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        lead: true,
        client: true,
        items: true,
        timelines: {
          orderBy: { createdAt: 'desc' },
        },
        proposals: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async update(id: string, data: Prisma.OpportunityUncheckedUpdateInput) {
    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        stage: { include: { pipeline: true } },
        owner: { select: { firstName: true, lastName: true, email: true } },
        lead: true,
        items: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.opportunity.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.opportunity.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  // Opportunity Items
  async deleteOpportunityItems(opportunityId: string) {
    return this.prisma.opportunityItem.deleteMany({
      where: { opportunityId },
    });
  }

  async createOpportunityItem(
    data: Prisma.OpportunityItemUncheckedCreateInput,
  ) {
    return this.prisma.opportunityItem.create({ data });
  }

  // Opportunity Timelines
  async createTimeline(data: Prisma.OpportunityTimelineUncheckedCreateInput) {
    return this.prisma.opportunityTimeline.create({ data });
  }

  async getTimeline(opportunityId: string) {
    return this.prisma.opportunityTimeline.findMany({
      where: { opportunityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Pipeline Operations
  async createPipeline(data: Prisma.PipelineCreateInput) {
    return this.prisma.pipeline.create({ data });
  }

  async getPipelines() {
    return this.prisma.pipeline.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        stages: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async getPipelineById(id: string) {
    return this.prisma.pipeline.findFirst({
      where: { id, deletedAt: null },
      include: {
        stages: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async getPipelineByName(name: string) {
    return this.prisma.pipeline.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async updatePipeline(id: string, data: Prisma.PipelineUpdateInput) {
    return this.prisma.pipeline.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async deletePipeline(id: string, userId: string) {
    return this.prisma.pipeline.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  // Pipeline Stage Operations
  async createPipelineStage(data: Prisma.PipelineStageUncheckedCreateInput) {
    return this.prisma.pipelineStage.create({ data });
  }

  async getPipelineStages(pipelineId: string) {
    return this.prisma.pipelineStage.findMany({
      where: { pipelineId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPipelineStageById(id: string) {
    return this.prisma.pipelineStage.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async updatePipelineStage(
    id: string,
    data: Prisma.PipelineStageUncheckedUpdateInput,
  ) {
    return this.prisma.pipelineStage.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async deletePipelineStage(id: string, userId: string) {
    return this.prisma.pipelineStage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
