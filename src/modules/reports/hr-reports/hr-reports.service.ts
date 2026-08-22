import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { executeQuery } from '../utils/query-engine.helper';

@Injectable()
export class HrReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployeeAttrition(tenantId: string, filters: any) {
    const profiles = await executeQuery(this.prisma, 'employeeProfile', {
      tenantId,
      filters,
    });

    const activeCount = profiles.filter((p) => !p.exitDate).length;
    const exitedCount = profiles.filter(
      (p) => p.exitDate && new Date(p.exitDate) <= new Date(),
    ).length;

    const turnover =
      activeCount + exitedCount > 0
        ? (exitedCount / (activeCount + exitedCount)) * 100
        : 0;

    return {
      activeEmployees: activeCount,
      exitedEmployees: exitedCount,
      turnoverRatePercentage: Math.round(turnover * 100) / 100,
    };
  }

  async getTrainingMetrics(tenantId: string, filters: any) {
    const enrollments = await executeQuery(this.prisma, 'trainingEnrollment', {
      tenantId,
      filters,
    });

    const completed = enrollments.filter(
      (e) => e.status === 'COMPLETED',
    ).length;
    const pending = enrollments.filter(
      (e) => e.status === 'ENROLLED' || e.status === 'IN_PROGRESS',
    ).length;

    const completionRate =
      enrollments.length > 0 ? (completed / enrollments.length) * 100 : 0;

    return {
      totalEnrollments: enrollments.length,
      completedCount: completed,
      pendingCount: pending,
      completionRatePercentage: Math.round(completionRate * 100) / 100,
    };
  }
}
