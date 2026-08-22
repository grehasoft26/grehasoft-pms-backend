import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { executeQuery } from '../utils/query-engine.helper';

@Injectable()
export class ProjectReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectHealth(tenantId: string, filters: any) {
    const projects = await executeQuery(this.prisma, 'project', {
      tenantId,
      filters,
      includes: ['tasks', 'members'],
    });

    const healthStatus = projects.map((p) => {
      // Calculate based on overdue tasks count
      const totalTasks = p.tasks?.length || 0;
      const overdueTasks =
        p.tasks?.filter(
          (t: any) =>
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== 'COMPLETED',
        ).length || 0;

      let status = 'GREEN';
      if (overdueTasks > 5) status = 'RED';
      else if (overdueTasks > 2) status = 'YELLOW';

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        totalTasks,
        overdueTasks,
        status,
      };
    });

    const redCount = healthStatus.filter((h) => h.status === 'RED').length;
    const yellowCount = healthStatus.filter(
      (h) => h.status === 'YELLOW',
    ).length;
    const greenCount = healthStatus.filter((h) => h.status === 'GREEN').length;

    return {
      projects: healthStatus,
      summary: { GREEN: greenCount, YELLOW: yellowCount, RED: redCount },
    };
  }

  async getDelayedProjects(tenantId: string, filters: any) {
    const projects = await executeQuery(this.prisma, 'project', {
      tenantId,
      filters,
    });

    // delayed if endDate < now and status is not COMPLETED/ARCHIVED
    const now = new Date();
    const delayed = projects.filter((p) => {
      return p.endDate && new Date(p.endDate) < now && p.status !== 'COMPLETED';
    });

    return {
      totalProjects: projects.length,
      delayedProjectsCount: delayed.length,
      delayedProjects: delayed.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        endDate: d.endDate,
      })),
    };
  }

  async getResourceUtilization(tenantId: string, filters: any) {
    // Member counts assigned to active projects
    const members = await executeQuery(this.prisma, 'projectMember', {
      tenantId,
      filters,
      includes: ['user', 'project'],
    });

    // Group by User
    const utilization: Record<string, { name: string; projectsCount: number }> =
      {};
    for (const m of members) {
      if (m.user) {
        const name = `${m.user.firstName} ${m.user.lastName}`;
        if (!utilization[m.userId]) {
          utilization[m.userId] = { name, projectsCount: 0 };
        }
        utilization[m.userId].projectsCount++;
      }
    }

    const list = Object.entries(utilization).map(([userId, data]) => {
      // Calculate rate out of 3 maximum concurrent projects allocation
      const allocationRate = Math.min((data.projectsCount / 3) * 100, 100);
      return {
        userId,
        name: data.name,
        allocatedProjects: data.projectsCount,
        utilizationPercentage: Math.round(allocationRate),
      };
    });

    return {
      resourceUtilizationList: list,
      averageUtilization:
        list.length > 0
          ? Math.round(
              list.reduce((acc, curr) => acc + curr.utilizationPercentage, 0) /
                list.length,
            )
          : 0,
    };
  }
}
