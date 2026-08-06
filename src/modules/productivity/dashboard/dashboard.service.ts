import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class TimeTrackingDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Working Users (active WorkSession with no end time)
    const workingSessions = await this.prisma.workSession.findMany({
      where: { endTime: null },
      select: { id: true, userId: true },
    });
    const workingCount = workingSessions.length;

    // 2. Break Users (has active work session AND active break session)
    const breakCount = await this.prisma.breakSession.count({
      where: {
        workSessionId: { in: workingSessions.map((w) => w.id) },
        endTime: null,
      },
    });

    // 3. Idle Users (has active work session AND active idle session)
    const idleCount = await this.prisma.idleSession.count({
      where: {
        workSessionId: { in: workingSessions.map((w) => w.id) },
        endTime: null,
      },
    });

    // 4. Offline Users (Total user accounts - working users count)
    const totalUsers = await this.prisma.user.count({ where: { deletedAt: null } });
    const offlineCount = totalUsers - workingCount >= 0 ? totalUsers - workingCount : 0;

    // 5. Daily, Weekly, Monthly Hours
    // Daily Hours
    const dailySum = await this.prisma.timeEntry.aggregate({
      where: { startTime: { gte: todayStart } },
      _sum: { duration: true },
    });
    const dailyHours = (dailySum._sum.duration || 0) / 3600;

    // Weekly Hours
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklySum = await this.prisma.timeEntry.aggregate({
      where: { startTime: { gte: startOfWeek } },
      _sum: { duration: true },
    });
    const weeklyHours = (weeklySum._sum.duration || 0) / 3600;

    // Monthly Hours
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySum = await this.prisma.timeEntry.aggregate({
      where: { startTime: { gte: startOfMonth } },
      _sum: { duration: true },
    });
    const monthlyHours = (monthlySum._sum.duration || 0) / 3600;

    // 6. Top & Lowest Productivity list (from productivity scores)
    const scores = await this.prisma.productivityScore.findMany({
      where: { date: todayStart },
      orderBy: { score: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 5,
    });

    const topProductivity = scores.map((s) => ({
      userId: s.userId,
      name: `${s.user.firstName} ${s.user.lastName}`,
      score: Number(s.score),
    }));

    const lowestScores = await this.prisma.productivityScore.findMany({
      where: { date: todayStart },
      orderBy: { score: 'asc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 5,
    });

    const lowestProductivity = lowestScores.map((s) => ({
      userId: s.userId,
      name: `${s.user.firstName} ${s.user.lastName}`,
      score: Number(s.score),
    }));

    // Pending Timesheets count
    const pendingTimesheets = await this.prisma.weeklyTimesheet.count({
      where: { status: 'SUBMITTED' },
    });

    return {
      workingUsers: workingCount,
      idleUsers: idleCount,
      breakUsers: breakCount,
      offlineUsers: offlineCount,
      dailyHours,
      weeklyHours,
      monthlyHours,
      topProductivity,
      lowestProductivity,
      pendingTimesheets,
    };
  }
}
