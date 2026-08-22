import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TimeEntriesRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.TimeEntryUncheckedCreateInput) {
    return this.prisma.timeEntry.create({
      data,
      include: {
        task: { select: { id: true, code: true, title: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findMany(filters: {
    userId?: string;
    projectId?: string;
    taskId?: string;
    approved?: boolean;
  }) {
    const where: Prisma.TimeEntryWhereInput = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.taskId) where.taskId = filters.taskId;
    if (filters.approved !== undefined) where.approved = filters.approved;

    return this.prisma.timeEntry.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        task: { select: { id: true, code: true, title: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        task: true,
        project: true,
      },
    });
  }

  async update(id: string, data: Prisma.TimeEntryUncheckedUpdateInput) {
    return this.prisma.timeEntry.update({
      where: { id },
      data,
      include: {
        task: { select: { id: true, code: true, title: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.timeEntry.delete({
      where: { id },
    });
  }

  // Get daily sums of work logged
  async getDailySum(userId: string, date: Date) {
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: { gte: startOfDay, lt: endOfDay },
      },
    });

    let totalDuration = 0;
    let billableDuration = 0;

    for (const entry of entries) {
      totalDuration += entry.duration;
      if (entry.billable) {
        billableDuration += entry.duration;
      }
    }

    return {
      totalHours: totalDuration / 3600,
      billableHours: billableDuration / 3600,
      entries,
    };
  }
}
