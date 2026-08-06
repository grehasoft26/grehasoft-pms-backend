import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { executeQuery } from '../utils/query-engine.helper';

@Injectable()
export class ProductivityReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductivityMetrics(tenantId: string, filters: any) {
    const entries = await executeQuery(this.prisma, 'timeEntry', {
      tenantId,
      filters,
    });

    let billableSeconds = 0;
    let nonBillableSeconds = 0;

    for (const e of entries) {
      const sec = Number(e.duration || 0);
      if (e.billable) {
        billableSeconds += sec;
      } else {
        nonBillableSeconds += sec;
      }
    }

    const totalSeconds = billableSeconds + nonBillableSeconds;
    const billableHours = Math.round((billableSeconds / 3600) * 100) / 100;
    const nonBillableHours = Math.round((nonBillableSeconds / 3600) * 100) / 100;
    const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;

    const utilization = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

    return {
      billableHours,
      nonBillableHours,
      totalHours,
      utilizationRatePercentage: Math.round(utilization * 100) / 100,
    };
  }
}
