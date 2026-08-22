import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class TaskDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId?: string, projectId?: string) {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // Basic filters
    const taskQuery: any = { deletedAt: null };
    if (projectId) taskQuery.projectId = projectId;

    // 1. Assigned Today
    const assignedTodayQuery = { ...taskQuery, createdAt: { gte: todayStart } };
    if (userId) {
      assignedTodayQuery.assignees = { some: { id: userId } };
    }
    const assignedToday = await this.prisma.task.count({
      where: assignedTodayQuery,
    });

    // 2. Completed Today (status code = DONE and updated today)
    const completedTodayQuery = {
      ...taskQuery,
      status: { code: 'DONE' },
      updatedAt: { gte: todayStart },
    };
    if (userId) {
      completedTodayQuery.assignees = { some: { id: userId } };
    }
    const completedToday = await this.prisma.task.count({
      where: completedTodayQuery,
    });

    // 3. Overdue (status not DONE and dueDate < today)
    const overdueQuery = {
      ...taskQuery,
      status: { code: { not: 'DONE' } },
      dueDate: { lt: todayStart },
    };
    if (userId) {
      overdueQuery.assignees = { some: { id: userId } };
    }
    const overdue = await this.prisma.task.count({ where: overdueQuery });

    // 4. Blocked (status code = BLOCKED)
    const blockedQuery = { ...taskQuery, status: { code: 'BLOCKED' } };
    if (userId) {
      blockedQuery.assignees = { some: { id: userId } };
    }
    const blocked = await this.prisma.task.count({ where: blockedQuery });

    // 5. High Priority (priority code in HIGH, CRITICAL)
    const highPriorityQuery = {
      ...taskQuery,
      priority: { code: { in: ['HIGH', 'CRITICAL'] } },
    };
    if (userId) {
      highPriorityQuery.assignees = { some: { id: userId } };
    }
    const highPriority = await this.prisma.task.count({
      where: highPriorityQuery,
    });

    // 6. Upcoming Deadlines (due in next 7 days, incomplete)
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const upcomingDeadlinesQuery = {
      ...taskQuery,
      status: { code: { not: 'DONE' } },
      dueDate: { gte: todayStart, lte: next7Days },
    };
    if (userId) {
      upcomingDeadlinesQuery.assignees = { some: { id: userId } };
    }
    const upcomingTasks = await this.prisma.task.findMany({
      where: upcomingDeadlinesQuery,
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: {
        status: true,
        priority: true,
      },
    });

    // 7. Active Sprint Burndown metrics
    const activeSprint = await this.prisma.sprint.findFirst({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        tasks: {
          where: { deletedAt: null },
        },
      },
    });

    let sprintBurndown = null;
    if (activeSprint) {
      const totalTasks = activeSprint.tasks.length;
      const completedTasks = activeSprint.tasks.filter(
        (t) => t.statusId === 'DONE',
      ).length; // simple check
      const totalStoryPoints = activeSprint.tasks.reduce(
        (sum, t) => sum + (t.storyPoints || 0),
        0,
      );
      const remainingStoryPoints = activeSprint.tasks
        .filter((t) => t.statusId !== 'DONE')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      sprintBurndown = {
        sprintId: activeSprint.id,
        sprintName: activeSprint.name,
        startDate: activeSprint.startDate,
        endDate: activeSprint.endDate,
        totalTasks,
        completedTasks,
        totalStoryPoints,
        remainingStoryPoints,
      };
    }

    // 8. Team Velocity (sum of completed task story points for last 3 completed sprints)
    const completedSprints = await this.prisma.sprint.findMany({
      where: {
        status: 'COMPLETED',
        deletedAt: null,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { endDate: 'desc' },
      take: 3,
      include: {
        tasks: {
          where: { deletedAt: null, status: { code: 'DONE' } },
        },
      },
    });

    const teamVelocity = completedSprints.map((sprint) => {
      const storyPointsCompleted = sprint.tasks.reduce(
        (sum, t) => sum + (t.storyPoints || 0),
        0,
      );
      return {
        sprintId: sprint.id,
        sprintName: sprint.name,
        storyPointsCompleted,
      };
    });

    // 9. Workload per team member (open tasks count / open hours sum)
    const openTasks = await this.prisma.task.findMany({
      where: {
        ...taskQuery,
        status: { code: { not: 'DONE' } },
      },
      include: {
        assignees: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const workloadMap = new Map<
      string,
      { name: string; taskCount: number; remainingHours: number }
    >();
    for (const t of openTasks) {
      const hrs = Number(t.remainingHours || 0);
      for (const user of t.assignees) {
        const key = user.id;
        const exist = workloadMap.get(key) || {
          name: `${user.firstName} ${user.lastName}`,
          taskCount: 0,
          remainingHours: 0,
        };
        exist.taskCount += 1;
        exist.remainingHours += hrs;
        workloadMap.set(key, exist);
      }
    }

    const workload = Array.from(workloadMap.entries()).map(
      ([userId, data]) => ({
        userId,
        ...data,
      }),
    );

    return {
      assignedToday,
      completedToday,
      overdue,
      blocked,
      highPriority,
      upcomingTasks,
      sprintBurndown,
      teamVelocity,
      workload,
    };
  }
}
