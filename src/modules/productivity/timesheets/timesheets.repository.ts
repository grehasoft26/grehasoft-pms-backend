import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, TimesheetStatus } from '@prisma/client';

@Injectable()
export class TimesheetsRepository {
  constructor(public readonly prisma: PrismaService) {}

  // Daily Timesheets
  async upsertDaily(
    userId: string,
    date: Date,
    totalHours: number,
    billableHours: number,
  ) {
    const formattedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    return this.prisma.dailyTimesheet.upsert({
      where: {
        userId_date: {
          userId,
          date: formattedDate,
        },
      },
      update: {
        totalHours,
        billableHours,
      },
      create: {
        userId,
        date: formattedDate,
        totalHours,
        billableHours,
        status: TimesheetStatus.DRAFT,
      },
    });
  }

  async findDaily(userId: string, date: Date) {
    const formattedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    return this.prisma.dailyTimesheet.findUnique({
      where: {
        userId_date: {
          userId,
          date: formattedDate,
        },
      },
      include: {
        timeEntries: true,
      },
    });
  }

  // Weekly Timesheets
  async upsertWeekly(
    userId: string,
    startDate: Date,
    endDate: Date,
    totalHours: number,
  ) {
    const formattedStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const formattedEnd = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );

    return this.prisma.weeklyTimesheet.upsert({
      where: {
        userId_startDate: {
          userId,
          startDate: formattedStart,
        },
      },
      update: {
        totalHours,
      },
      create: {
        userId,
        startDate: formattedStart,
        endDate: formattedEnd,
        totalHours,
        status: TimesheetStatus.DRAFT,
      },
    });
  }

  async findWeekly(userId: string, startDate: Date) {
    const formattedStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    return this.prisma.weeklyTimesheet.findUnique({
      where: {
        userId_startDate: {
          userId,
          startDate: formattedStart,
        },
      },
      include: {
        approvals: {
          orderBy: { actionedAt: 'desc' },
          include: {
            approver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findWeeklyById(id: string) {
    return this.prisma.weeklyTimesheet.findUnique({
      where: { id },
      include: {
        approvals: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async updateWeeklyStatus(id: string, status: TimesheetStatus) {
    return this.prisma.weeklyTimesheet.update({
      where: { id },
      data: { status },
    });
  }

  // Approvals
  async createApproval(data: Prisma.TimesheetApprovalUncheckedCreateInput) {
    return this.prisma.timesheetApproval.create({
      data,
    });
  }

  async getPendingWeeklyTimesheets() {
    return this.prisma.weeklyTimesheet.findMany({
      where: { status: TimesheetStatus.SUBMITTED },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
