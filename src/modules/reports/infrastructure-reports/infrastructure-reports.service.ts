import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { executeQuery } from '../utils/query-engine.helper';

@Injectable()
export class InfrastructureReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeploymentsMetrics(tenantId: string, filters: any) {
    const deployments = await executeQuery(this.prisma, 'deployment', {
      tenantId,
      filters,
    });

    const total = deployments.length;
    const success = deployments.filter((d) => d.status === 'SUCCESS').length;
    const failed = deployments.filter((d) => d.status === 'FAILED').length;
    const rollbacks = deployments.filter((d) => d.status === 'ROLLBACK').length;

    const rate = total > 0 ? (success / total) * 100 : 0;
    const avgDuration =
      total > 0
        ? deployments.reduce((acc, curr) => acc + (curr.duration || 0), 0) /
          total
        : 0;

    return {
      totalDeployments: total,
      successfulCount: success,
      failedCount: failed,
      rollbackCount: rollbacks,
      successRatePercentage: Math.round(rate * 100) / 100,
      averageDurationSeconds: Math.round(avgDuration),
    };
  }

  async getBackupsMetrics(tenantId: string, filters: any) {
    const backups = await executeQuery(this.prisma, 'backup', {
      tenantId,
      filters,
    });

    const total = backups.length;
    const completed = backups.filter((b) => b.status === 'COMPLETED').length;
    const failed = backups.filter((b) => b.status === 'FAILED').length;

    const rate = total > 0 ? (completed / total) * 100 : 0;

    return {
      totalBackups: total,
      completedCount: completed,
      failedCount: failed,
      successRatePercentage: Math.round(rate * 100) / 100,
    };
  }
}
