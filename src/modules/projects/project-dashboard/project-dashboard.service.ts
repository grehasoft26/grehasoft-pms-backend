import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  ProjectStatus,
  MilestoneStatus,
  RiskStatus,
  IssueStatus,
  ProjectHealth,
} from '@prisma/client';

@Injectable()
export class ProjectDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId?: string) {
    const now = new Date();

    // 1. My Projects (projects managed by current user)
    const myProjectsQuery: any = { deletedAt: null };
    if (userId) {
      myProjectsQuery.managerId = userId;
    }
    const myProjectsCount = await this.prisma.project.count({
      where: myProjectsQuery,
    });

    // 2. Project counts by status
    const [activeCount, completedCount, planningCount, archivedCount] =
      await Promise.all([
        this.prisma.project.count({
          where: { status: ProjectStatus.ACTIVE, deletedAt: null },
        }),
        this.prisma.project.count({
          where: { status: ProjectStatus.COMPLETED, deletedAt: null },
        }),
        this.prisma.project.count({
          where: { status: ProjectStatus.PLANNING, deletedAt: null },
        }),
        this.prisma.project.count({
          where: { status: ProjectStatus.ARCHIVED, deletedAt: null },
        }),
      ]);

    // 3. Delayed Projects (Active/Planning projects past their end date and not 100% complete)
    const delayedProjects = await this.prisma.project.findMany({
      where: {
        deletedAt: null,
        status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING] },
        endDate: { lt: now },
        completionPercentage: { lt: 100 },
      },
      select: {
        id: true,
        code: true,
        name: true,
        endDate: true,
        completionPercentage: true,
      },
    });

    // 4. Upcoming Milestones (Incomplete milestones due in future, limit to 5)
    const upcomingMilestones = await this.prisma.projectMilestone.findMany({
      where: {
        deletedAt: null,
        status: { not: MilestoneStatus.COMPLETED },
        dueDate: { gte: now },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        project: { select: { name: true } },
        owner: { select: { firstName: true, lastName: true } },
      },
    });

    // 5. Critical Risks (Risk score >= 12 or status = IDENTIFIED/OCCURRED with score >= 12, limit to 5)
    const criticalRisks = await this.prisma.projectRisk.findMany({
      where: {
        deletedAt: null,
        status: { in: [RiskStatus.IDENTIFIED, RiskStatus.OCCURRED] },
        riskScore: { gte: 12 },
      },
      orderBy: { riskScore: 'desc' },
      take: 5,
      include: {
        project: { select: { name: true } },
      },
    });

    // 6. Open Issues (Blocker / Critical priority issues, limit to 5)
    const openIssues = await this.prisma.projectIssue.findMany({
      where: {
        deletedAt: null,
        status: { notIn: [IssueStatus.CLOSED, IssueStatus.RESOLVED] },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: {
        project: { select: { name: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    });

    // 7. Budget Utilization (across all non-deleted projects)
    const budgetStats = await this.prisma.project.aggregate({
      where: { deletedAt: null },
      _sum: {
        estimatedCost: true,
        actualCost: true,
        remainingBudget: true,
        budgetVariance: true,
      },
    });

    // 8. Project Health Counts
    const [greenHealth, amberHealth, redHealth] = await Promise.all([
      this.prisma.project.count({
        where: { healthStatus: ProjectHealth.GREEN, deletedAt: null },
      }),
      this.prisma.project.count({
        where: { healthStatus: ProjectHealth.AMBER, deletedAt: null },
      }),
      this.prisma.project.count({
        where: { healthStatus: ProjectHealth.RED, deletedAt: null },
      }),
    ]);

    // 9. Resource Allocation (allocated employees count and list)
    const allocatedResourcesCount = await this.prisma.projectResource.count({});
    const activeAllocations = await this.prisma.projectResource.findMany({
      take: 10,
      include: {
        user: { select: { firstName: true, lastName: true } },
        project: { select: { name: true } },
      },
    });

    return {
      projectsSummary: {
        total: activeCount + completedCount + planningCount + archivedCount,
        active: activeCount,
        completed: completedCount,
        planning: planningCount,
        archived: archivedCount,
        myProjectsCount,
      },
      delayedProjectsCount: delayedProjects.length,
      delayedProjects,
      upcomingMilestones,
      criticalRisks,
      openIssues,
      budgetUtilization: {
        totalEstimatedCost: Number(budgetStats._sum.estimatedCost || 0),
        totalActualCost: Number(budgetStats._sum.actualCost || 0),
        totalRemainingBudget: Number(budgetStats._sum.remainingBudget || 0),
        totalBudgetVariance: Number(budgetStats._sum.budgetVariance || 0),
      },
      projectHealth: {
        green: greenHealth,
        amber: amberHealth,
        red: redHealth,
      },
      resourceAllocation: {
        allocatedCount: allocatedResourcesCount,
        activeAllocations,
      },
    };
  }
}
