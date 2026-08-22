import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class UtilizationReportService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReport(filters: {
    userId?: string;
    projectId?: string;
    teamId?: string;
    departmentId?: string;
    startDate: string;
    endDate: string;
  }) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);

    const where: any = {
      startTime: { gte: start, lte: end },
    };

    if (filters.userId) {
      where.userId = filters.userId;
    } else if (filters.projectId) {
      where.projectId = filters.projectId;
    } else if (filters.teamId) {
      // Find users in team
      const teamUsers = await this.prisma.userTeam.findMany({
        where: { teamId: filters.teamId },
        select: { userId: true },
      });
      where.userId = { in: teamUsers.map((u) => u.userId) };
    } else if (filters.departmentId) {
      // Find users in department
      const deptUsers = await this.prisma.user.findMany({
        where: { departmentId: filters.departmentId },
        select: { id: true },
      });
      where.userId = { in: deptUsers.map((u) => u.id) };
    }

    const entries = await this.prisma.timeEntry.findMany({ where });
    let totalSeconds = 0;
    let billableSeconds = 0;

    for (const entry of entries) {
      totalSeconds += entry.duration;
      if (entry.billable) {
        billableSeconds += entry.duration;
      }
    }

    const billablePercentage =
      totalSeconds > 0 ? Math.round((billableSeconds / totalSeconds) * 100) : 0;
    const nonBillablePercentage =
      totalSeconds > 0 ? 100 - billablePercentage : 0;

    // Save report in db
    const report = await this.prisma.utilizationReport.create({
      data: {
        userId: filters.userId || null,
        projectId: filters.projectId || null,
        teamId: filters.teamId || null,
        departmentId: filters.departmentId || null,
        date: start,
        billablePercentage,
        nonBillablePercentage,
      },
    });

    return {
      reportId: report.id,
      totalHours: totalSeconds / 3600,
      billableHours: billableSeconds / 3600,
      billablePercentage,
      nonBillablePercentage,
    };
  }
}
