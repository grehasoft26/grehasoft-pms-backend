import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class WorkforceDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveDashboard(tenantId: string, executiveId: string) {
    const campaigns = await this.prisma.sEOProject.findMany({
      where: { tenantId, ownerId: executiveId, deletedAt: null },
    });

    const campaignIds = campaigns.map((c: any) => c.id);

    // Get current month e.g. "2026-08"
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Targets for this executive this month
    const targets = await this.prisma.sEOMonthlyTarget.findMany({
      where: {
        tenantId,
        executiveId,
        month: currentMonth,
        deletedAt: null,
      },
      include: { activityType: true, seoProject: true },
    });

    // Calculate achievements for targets
    let totalTargetCount = 0;
    let totalAchievedCount = 0;

    const enhancedTargets = await Promise.all(
      targets.map(async (t: any) => {
        const approvedCount = await this.calculateApprovedCount(
          tenantId,
          executiveId,
          t.seoProjectId,
          currentMonth,
          t.activityTypeId,
        );
        totalTargetCount += t.targetCount;
        totalAchievedCount += approvedCount;
        return {
          ...t,
          achieved: approvedCount,
          remaining: Math.max(0, t.targetCount - approvedCount),
        };
      }),
    );

    const overallProgress =
      totalTargetCount > 0
        ? Math.min(
            100,
            Math.round((totalAchievedCount / totalTargetCount) * 100),
          )
        : 0;

    // Daily log statuses counts
    const logs = await this.prisma.sEODailyWorkLog.findMany({
      where: { tenantId, executiveId, deletedAt: null },
    });

    const pendingReview = logs.filter(
      (l: any) => l.status === 'SUBMITTED',
    ).length;
    const approved = logs.filter((l: any) => l.status === 'APPROVED').length;
    const rejected = logs.filter((l: any) => l.status === 'REJECTED').length;
    const revisionRequired = logs.filter(
      (l: any) => l.status === 'REVISION_REQUIRED',
    ).length;

    // Backlinks created count
    const backlinksCount = await this.prisma.backlink.count({
      where: {
        tenantId,
        seoProjectId: { in: campaignIds },
      },
    });

    // Keywords count
    const keywordsCount = await this.prisma.keyword.count({
      where: {
        tenantId,
        seoProjectId: { in: campaignIds },
      },
    });

    // Recent work logs
    const recentLogs = await this.prisma.sEODailyWorkLog.findMany({
      where: { tenantId, executiveId, deletedAt: null },
      include: { seoProject: true, items: { include: { activityType: true } } },
      orderBy: { logDate: 'desc' },
      take: 5,
    });

    return {
      campaignsCount: campaigns.length,
      assignedCampaigns: campaigns,
      targets: enhancedTargets,
      overallTargetCount: totalTargetCount,
      overallAchievedCount: totalAchievedCount,
      overallProgress,
      pendingReview,
      approvedCount: approved,
      rejectedCount: rejected,
      revisionRequiredCount: revisionRequired,
      backlinksCount,
      keywordsCount,
      recentLogs,
    };
  }

  async getManagerDashboard(tenantId: string) {
    // Get all executives
    const executives = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    const campaigns = await this.prisma.sEOProject.findMany({
      where: { tenantId, deletedAt: null },
    });

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Aggregate monthly targets & achievements
    const allTargets = await this.prisma.sEOMonthlyTarget.findMany({
      where: { tenantId, month: currentMonth, deletedAt: null },
    });

    let totalTarget = 0;
    let totalAchieved = 0;

    for (const t of allTargets) {
      totalTarget += t.targetCount;
      totalAchieved += await this.calculateApprovedCount(
        tenantId,
        t.executiveId,
        t.seoProjectId,
        currentMonth,
        t.activityTypeId,
      );
    }

    const teamProgress =
      totalTarget > 0
        ? Math.min(100, Math.round((totalAchieved / totalTarget) * 100))
        : 0;

    // Logs metrics
    const allLogs = await this.prisma.sEODailyWorkLog.findMany({
      where: { tenantId, deletedAt: null },
    });

    const pendingReviewList = await this.prisma.sEODailyWorkLog.findMany({
      where: { tenantId, status: 'SUBMITTED', deletedAt: null },
      include: {
        executive: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        seoProject: true,
      },
      orderBy: { submittedAt: 'asc' },
    });

    const pendingCount = pendingReviewList.length;
    const approvedCount = allLogs.filter(
      (l: any) => l.status === 'APPROVED',
    ).length;
    const rejectedCount = allLogs.filter(
      (l: any) => l.status === 'REJECTED',
    ).length;
    const revisionCount = allLogs.filter(
      (l: any) => l.status === 'REVISION_REQUIRED',
    ).length;

    // Executive performance rankings (current month achievements)
    const rankings = await Promise.all(
      executives.map(async (exec: any) => {
        const approvedCount = await this.prisma.sEODailyWorkLog.findMany({
          where: {
            tenantId,
            executiveId: exec.id,
            status: 'APPROVED',
            logDate: {
              gte: new Date(`${currentMonth}-01`),
            },
          },
          include: { items: true },
        });

        let totalApprovedItems = 0;
        for (const log of approvedCount) {
          totalApprovedItems += log.items.reduce(
            (s: number, i: any) => s + (i.count || 1),
            0,
          );
        }

        return {
          ...exec,
          approvedSubmissions: totalApprovedItems,
        };
      }),
    );

    rankings.sort(
      (a: any, b: any) => b.approvedSubmissions - a.approvedSubmissions,
    );

    return {
      executivesCount: executives.length,
      activeCampaignsCount: campaigns.length,
      totalTarget,
      totalAchieved,
      teamProgress,
      pendingCount,
      approvedCount,
      rejectedCount,
      revisionCount,
      pendingReviewList,
      executivePerformance: rankings.slice(0, 10),
    };
  }

  private async calculateApprovedCount(
    tenantId: string,
    executiveId: string,
    seoProjectId: string | null,
    monthStr: string,
    activityTypeId: string,
  ): Promise<number> {
    const startDate = new Date(`${monthStr}-01`);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const matchWhere: any = {
      tenantId,
      status: 'APPROVED',
      executiveId,
      logDate: {
        gte: startDate,
        lt: nextMonth,
      },
    };

    if (seoProjectId) {
      matchWhere.seoProjectId = seoProjectId;
    }

    const logs = await this.prisma.sEODailyWorkLog.findMany({
      where: matchWhere,
      include: {
        items: {
          where: { activityTypeId },
        },
      },
    });

    let sum = 0;
    for (const log of logs) {
      for (const item of log.items) {
        sum += item.count || 1;
      }
    }
    return sum;
  }
}
