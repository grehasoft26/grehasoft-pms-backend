import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { executeQuery } from '../utils/query-engine.helper';

@Injectable()
export class CrmReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeadConversion(tenantId: string, filters: any) {
    // Total Leads vs leads with opportunities
    const totalLeads = await executeQuery(this.prisma, 'lead', {
      tenantId,
      filters,
    });

    const convertedLeads = await executeQuery(this.prisma, 'opportunity', {
      tenantId,
      filters: { ...filters, NOT: { leadId: null } },
    });

    const conversionRate =
      totalLeads.length > 0
        ? (convertedLeads.length / totalLeads.length) * 100
        : 0;

    return {
      totalLeads: totalLeads.length,
      convertedLeads: convertedLeads.length,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  async getSalesFunnel(tenantId: string, filters: any) {
    const opps = await executeQuery(this.prisma, 'opportunity', {
      tenantId,
      filters,
      includes: ['stage'],
    });

    // Group by stage
    const funnel: Record<string, number> = {};
    let totalValue = 0;

    for (const o of opps) {
      const stageName = o.stage?.name || 'Prospecting';
      funnel[stageName] = (funnel[stageName] || 0) + 1;
      totalValue += Number(o.value || 0);
    }

    return {
      stages: Object.entries(funnel).map(([stage, count]) => ({
        stage,
        count,
      })),
      totalOpportunities: opps.length,
      totalPipelineValue: totalValue,
    };
  }

  async getOpportunityWinRate(tenantId: string, filters: any) {
    const totalOpps = await executeQuery(this.prisma, 'opportunity', {
      tenantId,
      filters,
      includes: ['stage'],
    });

    // Assume win if stage name/code includes 'won' or probability = 100
    const wonOpps = totalOpps.filter(
      (o) =>
        o.probability === 100 ||
        o.stage?.name?.toLowerCase().includes('won') ||
        o.stage?.name?.toLowerCase().includes('close-won'),
    );

    const winRate =
      totalOpps.length > 0 ? (wonOpps.length / totalOpps.length) * 100 : 0;

    return {
      totalOpportunities: totalOpps.length,
      wonOpportunities: wonOpps.length,
      winRate: Math.round(winRate * 100) / 100,
    };
  }
}
