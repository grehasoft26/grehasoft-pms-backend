import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class CrmDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    
    // Start dates
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      leadsToday,
      leadsThisWeek,
      leadsThisMonth,
      totalLeadsCount,
      wonLeadsCount,
      totalRevenueRes,
      lostOpportunitiesCount,
      pipelineStages,
      topPerformers,
    ] = await Promise.all([
      // 1. Today's Leads
      this.prisma.lead.count({
        where: { createdAt: { gte: startOfToday }, deletedAt: null },
      }),
      // 2. Weekly Leads
      this.prisma.lead.count({
        where: { createdAt: { gte: startOfWeek }, deletedAt: null },
      }),
      // 3. Monthly Leads
      this.prisma.lead.count({
        where: { createdAt: { gte: startOfMonth }, deletedAt: null },
      }),
      // 4. Conversion Rate (WON Leads / Total Leads)
      this.prisma.lead.count({
        where: { deletedAt: null },
      }),
      this.prisma.lead.count({
        where: {
          status: { code: 'WON' },
          deletedAt: null,
        },
      }),
      // 5. Total Revenue (Value sum of CLOSED_WON opportunities)
      this.prisma.opportunity.aggregate({
        _sum: {
          value: true,
        },
        where: {
          stage: { code: 'CLOSED_WON' },
          deletedAt: null,
        },
      }),
      // 6. Lost Opportunities
      this.prisma.opportunity.count({
        where: {
          stage: { code: 'CLOSED_LOST' },
          deletedAt: null,
        },
      }),
      // 7. Sales Funnel (Opportunities by PipelineStage)
      this.prisma.pipelineStage.findMany({
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: {
              opportunities: {
                where: { deletedAt: null },
              },
            },
          },
        },
      }),
      // 8. Top Sales Executives (By Won Opportunity values)
      this.prisma.opportunity.groupBy({
        by: ['ownerId'],
        _sum: {
          value: true,
        },
        where: {
          stage: { code: 'CLOSED_WON' },
          deletedAt: null,
        },
        orderBy: {
          _sum: {
            value: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Format top performers
    const topSalesExecutives = await Promise.all(
      topPerformers.map(async (perf: any) => {
        const user = await this.prisma.user.findUnique({
          where: { id: perf.ownerId },
          select: { firstName: true, lastName: true, email: true },
        });
        return {
          ownerId: perf.ownerId,
          name: user ? `${user.firstName} ${user.lastName}` : 'Unknown Owner',
          email: user?.email,
          totalRevenue: perf._sum.value || 0,
        };
      })
    );

    const conversionRate = totalLeadsCount > 0 ? (wonLeadsCount / totalLeadsCount) * 100 : 0;
    const totalRevenue = totalRevenueRes._sum.value || 0;

    // Sales funnel format
    const salesFunnel = pipelineStages.map((stage: any) => ({
      stageId: stage.id,
      stageName: stage.name,
      stageCode: stage.code,
      count: stage._count.opportunities,
    }));

    return {
      leadsToday,
      leadsThisWeek,
      leadsThisMonth,
      conversionRate: Number(conversionRate.toFixed(2)),
      totalRevenue,
      lostOpportunities: lostOpportunitiesCount,
      salesFunnel,
      topSalesExecutives,
    };
  }
}
