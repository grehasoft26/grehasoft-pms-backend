import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { LeadFilterDto } from './dto/leads.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.LeadUncheckedCreateInput) {
    return this.prisma.lead.create({
      data,
      include: {
        source: true,
        status: true,
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findMany(filters: LeadFilterDto) {
    const where: Prisma.LeadWhereInput = {};

    // Soft delete filter
    if (filters.isDeleted === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search } },
        { contactName: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
        { gstNumber: { contains: filters.search } },
      ];
    }

    if (filters.priority) where.leadPriority = filters.priority;
    if (filters.temperature) where.leadTemperature = filters.temperature;
    if (filters.statusId) where.statusId = filters.statusId;
    if (filters.sourceId) where.sourceId = filters.sourceId;
    if (filters.ownerId) where.ownerId = filters.ownerId;

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          source: true,
          status: true,
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, totalCount };
  }

  async findById(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        source: true,
        status: true,
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        activities: {
          where: { deletedAt: null },
          orderBy: { activityDate: 'desc' },
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
          include: {
            assignee: { select: { firstName: true, lastName: true } },
            assignedBy: { select: { firstName: true, lastName: true } },
          },
        },
        timelines: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async update(id: string, data: Prisma.LeadUncheckedUpdateInput) {
    return this.prisma.lead.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        source: true,
        status: true,
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.lead.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.lead.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async checkDuplicates(params: {
    email?: string;
    phone?: string;
    companyName?: string;
    gstNumber?: string;
    excludeId?: string;
  }) {
    const OR: Prisma.LeadWhereInput[] = [];

    if (params.email) OR.push({ email: { equals: params.email } });
    if (params.phone) OR.push({ phone: { equals: params.phone } });
    if (params.companyName)
      OR.push({ companyName: { equals: params.companyName } });
    if (params.gstNumber) OR.push({ gstNumber: { equals: params.gstNumber } });

    if (OR.length === 0) return [];

    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
      OR,
    };

    if (params.excludeId) {
      where.id = { not: params.excludeId };
    }

    return this.prisma.lead.findMany({
      where,
      include: {
        status: true,
        source: true,
      },
    });
  }

  // Lead Timeline Operations
  async createTimeline(data: Prisma.LeadTimelineUncheckedCreateInput) {
    return this.prisma.leadTimeline.create({ data });
  }

  async getTimeline(leadId: string) {
    return this.prisma.leadTimeline.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Lead Assignment Operations
  async createAssignment(data: Prisma.LeadAssignmentUncheckedCreateInput) {
    return this.prisma.leadAssignment.create({ data });
  }

  async getAssignments(leadId: string) {
    return this.prisma.leadAssignment.findMany({
      where: { leadId },
      orderBy: { assignedAt: 'desc' },
      include: {
        assignee: { select: { firstName: true, lastName: true } },
        assignedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  // Lead Activity Operations
  async createActivity(data: Prisma.LeadActivityUncheckedCreateInput) {
    return this.prisma.leadActivity.create({ data });
  }

  async getActivities(leadId: string) {
    return this.prisma.leadActivity.findMany({
      where: { leadId, deletedAt: null },
      orderBy: { activityDate: 'desc' },
    });
  }

  async findActivityById(id: string) {
    return this.prisma.leadActivity.findUnique({
      where: { id },
    });
  }

  async updateActivity(
    id: string,
    data: Prisma.LeadActivityUncheckedUpdateInput,
  ) {
    return this.prisma.leadActivity.update({
      where: { id },
      data,
    });
  }

  async deleteActivity(id: string, userId: string) {
    return this.prisma.leadActivity.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
