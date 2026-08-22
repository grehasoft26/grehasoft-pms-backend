/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { executeQuery } from '../utils/query-engine.helper';

export interface RequestingUser {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

function formatSeconds(seconds: number): string {
  const secs = Math.max(0, Math.round(seconds));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(remainingSecs).padStart(2, '0'),
  ].join(':');
}

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
    const nonBillableHours =
      Math.round((nonBillableSeconds / 3600) * 100) / 100;
    const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;

    const utilization = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

    return {
      billableHours,
      nonBillableHours,
      totalHours,
      utilizationRatePercentage: Math.round(utilization * 100) / 100,
    };
  }

  private isPortalSession(session: any): boolean {
    const ua = (session.userAgent || '').toLowerCase();
    const isDesktopUA =
      ua.includes('electron') ||
      ua.includes('axios') ||
      ua.includes('desktop') ||
      ua.includes('tracker');
    return !isDesktopUA;
  }

  private async resolveAllowedUserIds(
    requestingUser: RequestingUser,
    targetUserId?: string,
    targetDepartmentId?: string,
    targetTeamId?: string,
  ): Promise<string[]> {
    const role = (requestingUser.roleName || '').toLowerCase();
    const isAdmin = role.includes('admin') || role.includes('super');
    const userId = requestingUser.id;

    if (role.includes('client')) {
      throw new ForbiddenException(
        'Clients do not have access to work reports.',
      );
    }

    if (isAdmin) {
      const filters: any = { deletedAt: null };
      if (targetUserId) {
        filters.id = targetUserId;
      }
      if (targetDepartmentId) {
        filters.departmentId = targetDepartmentId;
      }
      if (targetTeamId) {
        filters.teams = { some: { teamId: targetTeamId } };
      }
      const users = await this.prisma.user.findMany({
        where: filters,
        select: { id: true },
      });
      return users.map((u) => u.id);
    }

    // Manager / Team Lead Check
    const managedDepts = await this.prisma.department.findMany({
      where: { OR: [{ managerId: userId }, { deputyManagerId: userId }] },
      select: { id: true },
    });
    const deptIds = managedDepts.map((d) => d.id);

    const ledTeams = await this.prisma.team.findMany({
      where: { leadId: userId },
      select: { id: true },
    });
    const teamIds = ledTeams.map((t) => t.id);

    const isManager = deptIds.length > 0 || teamIds.length > 0;

    if (isManager) {
      const users = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { id: userId },
            { departmentId: { in: deptIds } },
            { teams: { some: { teamId: { in: teamIds } } } },
          ],
        },
        select: { id: true },
      });
      const allowedIds = users.map((u) => u.id);

      let filteredIds = allowedIds;
      if (targetUserId) {
        if (!allowedIds.includes(targetUserId)) {
          throw new ForbiddenException(
            'You do not have access to view this user.',
          );
        }
        filteredIds = [targetUserId];
      }
      if (targetDepartmentId) {
        const deptUsers = await this.prisma.user.findMany({
          where: { id: { in: filteredIds }, departmentId: targetDepartmentId },
          select: { id: true },
        });
        filteredIds = deptUsers.map((u) => u.id);
      }
      if (targetTeamId) {
        const teamUsers = await this.prisma.user.findMany({
          where: {
            id: { in: filteredIds },
            teams: { some: { teamId: targetTeamId } },
          },
          select: { id: true },
        });
        filteredIds = teamUsers.map((u) => u.id);
      }
      return filteredIds;
    }

    // Regular Employee
    if (targetUserId && targetUserId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view other users.',
      );
    }
    return [userId];
  }

  private async detectBreaksAndGaps(
    userId: string,
    startDate: Date,
    endDate: Date,
    sessions: any[],
  ) {
    const breaks: any[] = [];

    // 1. Offline Breaks: gaps between consecutive work sessions on the same day
    for (let i = 0; i < sessions.length - 1; i++) {
      const s1 = sessions[i];
      const s2 = sessions[i + 1];

      const s1Date = s1.startTime.toDateString();
      const s2Date = s2.startTime.toDateString();

      if (s1Date === s2Date) {
        const logout = s1.endTime || s1.updatedAt || s1.startTime;
        const login = s2.startTime;

        if (logout && login > logout) {
          const gap = (login.getTime() - logout.getTime()) / 1000;
          if (gap >= 60) {
            breaks.push({
              start: logout,
              end: login,
              duration: gap,
              type: 'offline',
              description: 'Away from keyboard / Offline',
            });
          }
        }
      }
    }

    // 2. In-Session Activity Gaps (Idle breaks > 3 mins)
    const sessionIds = sessions.map((s) => s.id);
    const activityLogs = await this.prisma.activityLog.findMany({
      where: { workSessionId: { in: sessionIds } },
      orderBy: { timestamp: 'asc' },
    });

    for (const session of sessions) {
      const logs = activityLogs.filter((l) => l.workSessionId === session.id);
      if (logs.length < 2) continue;

      for (let j = 0; j < logs.length - 1; j++) {
        const log1 = logs[j];
        const log2 = logs[j + 1];

        const log1End = new Date(log1.timestamp.getTime() + 60 * 1000);
        const log2Start = log2.timestamp;

        if (log2Start > log1End) {
          const gap = (log2Start.getTime() - log1End.getTime()) / 1000;
          if (gap >= 180) {
            breaks.push({
              start: log1End,
              end: log2Start,
              duration: gap,
              type: 'idle',
              description: 'Idle session',
            });
          }
        }
      }
    }

    breaks.sort((a, b) => a.start.getTime() - b.start.getTime());
    const totalBreakSeconds = breaks.reduce((sum, b) => sum + b.duration, 0);

    return {
      breaksList: breaks,
      breakCount: breaks.length,
      totalBreakSeconds,
    };
  }

  // --- CORE REPORTS ---

  async getDailyReportData(
    requestingUser: RequestingUser,
    startDateStr: string,
    endDateStr: string,
    targetUserId?: string,
    departmentId?: string,
    teamId?: string,
    search?: string,
  ) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const allowedUserIds = await this.resolveAllowedUserIds(
      requestingUser,
      targetUserId,
      departmentId,
      teamId,
    );

    const userFilters: any = { id: { in: allowedUserIds }, deletedAt: null };
    if (search) {
      userFilters.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where: userFilters,
      include: { department: true, role: true },
    });

    const userIds = users.map((u) => u.id);

    const sessions = await this.prisma.workSession.findMany({
      where: {
        userId: { in: userIds },
        startTime: { gte: start, lte: end },
      },
      orderBy: { startTime: 'asc' },
    });

    const reportRows = [];
    const dateList: Date[] = [];
    const temp = new Date(start);
    while (temp <= end) {
      dateList.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }

    for (const user of users) {
      const userCode = `GS-26-${user.id.substring(0, 4).toUpperCase()}`;
      const fullName =
        `${user.firstName} ${user.lastName}`.trim() || user.email;

      for (const d of dateList) {
        const daySessions = sessions.filter(
          (s) =>
            s.userId === user.id &&
            s.startTime.toDateString() === d.toDateString(),
        );

        if (daySessions.length === 0) {
          continue;
        }

        const firstLogin = new Date(
          Math.min(...daySessions.map((s) => s.startTime.getTime())),
        );
        const lastActive = new Date(
          Math.max(
            ...daySessions.map((s) => {
              const activeTime = s.endTime || s.updatedAt || s.startTime;
              return activeTime.getTime();
            }),
          ),
        );

        let productiveSec = 0;
        let idleSec = 0;
        let portalActiveSec = 0;

        for (const s of daySessions) {
          const sEnd = s.endTime || s.updatedAt || new Date();
          const sElapsed = Math.max(
            0,
            Math.round((sEnd.getTime() - s.startTime.getTime()) / 1000),
          );

          if (this.isPortalSession(s)) {
            portalActiveSec += sElapsed;
          } else {
            let sProd = Math.max(0, s.productiveTime || 0);
            let sIdle = Math.max(0, s.idleTime || 0);

            if (sProd + sIdle > sElapsed) {
              if (sProd > sElapsed) {
                sProd = sElapsed;
                sIdle = 0;
              } else {
                sIdle = sElapsed - sProd;
              }
            }
            productiveSec += sProd;
            idleSec += sIdle;
          }
        }

        const breakAnalysis = await this.detectBreaksAndGaps(
          user.id,
          d,
          d,
          daySessions,
        );
        const breakCount = breakAnalysis.breakCount;

        const offlineBreakSec = breakAnalysis.breaksList
          .filter((b) => b.type === 'offline')
          .reduce((sum, b) => sum + b.duration, 0);
        const idleBreakSec = breakAnalysis.breaksList
          .filter((b) => b.type === 'idle')
          .reduce((sum, b) => sum + b.duration, 0);

        const reconciledIdleSec = idleSec;
        const reconciledBreakSec = offlineBreakSec + idleBreakSec;

        const spannedDuration = Math.max(
          0,
          Math.round((lastActive.getTime() - firstLogin.getTime()) / 1000),
        );

        const desktopWorkSec = productiveSec + reconciledIdleSec;
        const totalEngagementSec = desktopWorkSec + portalActiveSec;

        const sumAccounted =
          productiveSec +
          reconciledIdleSec +
          portalActiveSec +
          reconciledBreakSec;
        const unaccountedSec = Math.max(0, spannedDuration - sumAccounted);

        const activityPct =
          desktopWorkSec > 0 ? (productiveSec / desktopWorkSec) * 100.0 : 0.0;

        const latestSession = daySessions[daySessions.length - 1];
        let status = 'Offline';
        if (
          d.toDateString() === new Date().toDateString() &&
          !latestSession.endTime
        ) {
          const now = new Date();
          const lastUpdate = latestSession.updatedAt || latestSession.startTime;
          const diff = (now.getTime() - lastUpdate.getTime()) / 1000;
          status = diff <= 300 ? 'Active' : 'Idle';
        }

        reportRows.push({
          employee_name: fullName,
          employee_code: userCode,
          department: user.department?.name || 'General',
          date: d.toISOString().split('T')[0],
          productive_time: formatSeconds(productiveSec),
          idle_time: formatSeconds(reconciledIdleSec),
          desktop_work_time: formatSeconds(desktopWorkSec),
          portal_active_time: formatSeconds(portalActiveSec),
          break_time: formatSeconds(reconciledBreakSec),
          unaccounted_time: formatSeconds(unaccountedSec),
          total_engagement_time: formatSeconds(totalEngagementSec),
          workday_span: formatSeconds(spannedDuration),
          activity_percentage: Math.min(
            100.0,
            Math.round(activityPct * 100) / 100,
          ),
          status,

          user_id: user.id,
          username: user.email,
          email: user.email,
          first_login: firstLogin.toISOString(),
          last_active: lastActive.toISOString(),
          total_tracked_time: formatSeconds(desktopWorkSec),
          break_count: breakCount,

          raw_tracked_seconds: desktopWorkSec,
          raw_productive_seconds: productiveSec,
          raw_idle_seconds: reconciledIdleSec,
          raw_desktop_work_seconds: desktopWorkSec,
          raw_portal_active_seconds: portalActiveSec,
          raw_break_seconds: reconciledBreakSec,
          raw_unaccounted_seconds: unaccountedSec,
          raw_total_engagement_seconds: totalEngagementSec,
          raw_workday_span: spannedDuration,
        });
      }
    }

    return reportRows;
  }

  async getReconciliationReportData(
    requestingUser: RequestingUser,
    startDateStr: string,
    endDateStr: string,
    targetUserId?: string,
    departmentId?: string,
    teamId?: string,
    search?: string,
  ) {
    const dailyData = await this.getDailyReportData(
      requestingUser,
      startDateStr,
      endDateStr,
      targetUserId,
      departmentId,
      teamId,
      search,
    );

    const reconRows = [];
    for (const row of dailyData) {
      const start = new Date(row.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(row.date);
      end.setHours(23, 59, 59, 999);

      const daySessions = await this.prisma.workSession.findMany({
        where: {
          userId: row.user_id,
          startTime: { gte: start, lte: end },
        },
      });

      let sessionDurationSec = 0;
      const productiveSec = row.raw_productive_seconds;
      const idleSec = row.raw_idle_seconds;
      const portalActiveSec = row.raw_portal_active_seconds;

      for (const s of daySessions) {
        const sEnd = s.endTime || s.updatedAt || new Date();
        const sElapsed = Math.max(
          0,
          Math.round((sEnd.getTime() - s.startTime.getTime()) / 1000),
        );
        sessionDurationSec += sElapsed;
      }

      const breakAnalysis = await this.detectBreaksAndGaps(
        row.user_id,
        start,
        end,
        daySessions,
      );
      const idleBreakSec = breakAnalysis.breaksList
        .filter((b) => b.type === 'idle')
        .reduce((sum, b) => sum + b.duration, 0);

      const sumAccountedSession =
        productiveSec + idleSec + portalActiveSec + idleBreakSec;
      const unaccountedSessionSec = Math.max(
        0,
        sessionDurationSec - sumAccountedSession,
      );

      reconRows.push({
        ...row,
        first_seen: row.first_login,
        session_duration: formatSeconds(sessionDurationSec),
        in_session_break_time: formatSeconds(idleBreakSec),
        unaccounted_session_time: formatSeconds(unaccountedSessionSec),
        raw_session_duration: sessionDurationSec,
        raw_in_session_break_seconds: idleBreakSec,
        raw_unaccounted_session_seconds: unaccountedSessionSec,
      });
    }

    return reconRows;
  }

  async getSessionAuditData(
    requestingUser: RequestingUser,
    startDateStr: string,
    endDateStr: string,
    targetUserId?: string,
  ) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const allowedUserIds = await this.resolveAllowedUserIds(
      requestingUser,
      targetUserId,
    );

    const sessions = await this.prisma.workSession.findMany({
      where: {
        userId: { in: allowedUserIds },
        startTime: { gte: start, lte: end },
      },
      include: { user: true },
      orderBy: { startTime: 'asc' },
    });

    const activeSessionsByUser: { [key: string]: any[] } = {};
    for (const s of sessions) {
      if (!s.endTime) {
        if (!activeSessionsByUser[s.userId]) {
          activeSessionsByUser[s.userId] = [];
        }
        activeSessionsByUser[s.userId].push(s);
      }
    }

    const auditRows = [];

    for (const s of sessions) {
      const user = s.user;
      const userCode = `GS-26-${user.id.substring(0, 4).toUpperCase()}`;
      const fullName =
        `${user.firstName} ${user.lastName}`.trim() || user.email;

      const lastActive = s.endTime || s.updatedAt || s.startTime;
      const elapsedSec = Math.max(
        0,
        Math.round((lastActive.getTime() - s.startTime.getTime()) / 1000),
      );

      const prodSec = s.productiveTime || 0;
      const idleSec = s.idleTime || 0;
      const trackedSec = prodSec + idleSec;
      const actPct = trackedSec > 0 ? (prodSec / trackedSec) * 100 : 0;

      const flags = [];
      let severity = 'Ok';

      if (!s.endTime && (activeSessionsByUser[s.userId]?.length || 0) > 1) {
        flags.push('Multiple overlapping active sessions exist for user');
        severity = 'Critical';
      }

      if (prodSec + idleSec > elapsedSec) {
        flags.push(
          `Productive + Idle (${prodSec + idleSec}s) exceeds elapsed session duration (${elapsedSec}s)`,
        );
        severity = 'Warning';
      } else if (trackedSec > elapsedSec) {
        flags.push(
          `Tracked seconds (${trackedSec}s) exceeds elapsed session duration (${elapsedSec}s)`,
        );
        severity = 'Warning';
      } else if (actPct > 100.0) {
        flags.push(`Activity percentage (${actPct}%) exceeds 100%`);
        severity = 'Warning';
      }

      if (prodSec < 0 || idleSec < 0) {
        flags.push('Negative tracking values detected');
        severity = 'Warning';
      }

      const statusStr = flags.length > 0 ? flags.join(', ') : 'Valid';

      auditRows.push({
        user_id: user.id,
        username: user.email,
        full_name: fullName,
        employee_code: userCode,
        session_id: s.id,
        device_id: this.isPortalSession(s) ? 'default' : 'desktop-tracker',
        login_time: s.startTime.toISOString(),
        last_active: lastActive.toISOString(),
        session_duration: formatSeconds(elapsedSec),
        productive_time: formatSeconds(prodSec),
        idle_time: formatSeconds(idleSec),
        tracked_time: formatSeconds(trackedSec),
        activity_percentage: Math.round(actPct * 100) / 100,
        validation_status: statusStr,
        severity,
        raw_elapsed_seconds: elapsedSec,
        raw_productive_seconds: prodSec,
        raw_idle_seconds: idleSec,
        raw_tracked_seconds: trackedSec,
      });
    }

    return auditRows;
  }

  async getWeeklyReportData(
    requestingUser: RequestingUser,
    startDateStr: string,
    endDateStr: string,
    departmentId?: string,
  ) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const rows = await this.getDailyReportData(
      requestingUser,
      startDateStr,
      endDateStr,
      undefined,
      departmentId,
    );

    if (rows.length === 0) {
      return {
        total_weekly_hours: '00:00:00',
        average_activity_percentage: 0.0,
        most_productive_day: '-',
        total_idle_time: '00:00:00',
        attendance_days: 0,
        app_usage_summary: [],
        daily_productivity_trend: [],
        weekly_work_hours: [],
      };
    }

    const totalTrackedSec = rows.reduce(
      (sum, r) => sum + r.raw_tracked_seconds,
      0,
    );
    const totalProductiveSec = rows.reduce(
      (sum, r) => sum + r.raw_productive_seconds,
      0,
    );
    const totalIdleSec = rows.reduce((sum, r) => sum + r.raw_idle_seconds, 0);

    const avgActivity =
      totalTrackedSec > 0 ? (totalProductiveSec / totalTrackedSec) * 100 : 0;

    const uniqueDates = new Set(rows.map((r) => `${r.user_id}_${r.date}`));
    const attendanceDays = uniqueDates.size;

    const dayProductivity: { [key: string]: number } = {};
    for (const r of rows) {
      dayProductivity[r.date] =
        (dayProductivity[r.date] || 0) + r.raw_productive_seconds;
    }

    let mostProductiveDay = '-';
    if (Object.keys(dayProductivity).length > 0) {
      const mostProductiveDateStr = Object.keys(dayProductivity).reduce(
        (a, b) => (dayProductivity[a] > dayProductivity[b] ? a : b),
      );
      const parsedDate = new Date(mostProductiveDateStr);
      mostProductiveDay = parsedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    const allowedUserIds = await this.resolveAllowedUserIds(
      requestingUser,
      undefined,
      departmentId,
    );
    const dbAppUsages = await this.prisma.applicationUsage.findMany({
      where: {
        workSession: {
          userId: { in: allowedUserIds },
          startTime: { gte: start, lte: end },
        },
      },
    });

    const appUsageGroups: {
      [key: string]: { duration: number; isProd: boolean };
    } = {};
    for (const au of dbAppUsages) {
      const name = au.appName;
      const isProd = au.category !== 'UNPRODUCTIVE';
      if (!appUsageGroups[name]) {
        appUsageGroups[name] = { duration: 0, isProd };
      }
      appUsageGroups[name].duration += au.duration;
    }

    const appUsageSummary = Object.keys(appUsageGroups)
      .map((name) => ({
        app_name: name,
        duration_seconds: appUsageGroups[name].duration,
        duration_formatted: formatSeconds(appUsageGroups[name].duration),
        is_productive: appUsageGroups[name].isProd,
        category: appUsageGroups[name].isProd ? 'Productive' : 'Non Productive',
      }))
      .sort((a, b) => b.duration_seconds - a.duration_seconds)
      .slice(0, 10);

    const dailyTrend = [];
    const temp = new Date(start);
    while (temp <= end) {
      const dateStr = temp.toISOString().split('T')[0];
      const dayRows = rows.filter((r) => r.date === dateStr);
      const dayProd =
        dayRows.reduce((sum, r) => sum + r.raw_productive_seconds, 0) / 3600.0;
      const dayIdle =
        dayRows.reduce((sum, r) => sum + r.raw_idle_seconds, 0) / 3600.0;

      dailyTrend.push({
        date: temp.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        productive_hours: Math.round(dayProd * 100) / 100,
        idle_hours: Math.round(dayIdle * 100) / 100,
      });
      temp.setDate(temp.getDate() + 1);
    }

    const userHours: { [key: string]: number } = {};
    for (const r of rows) {
      userHours[r.employee_name] =
        (userHours[r.employee_name] || 0) + r.raw_tracked_seconds;
    }

    const weeklyWorkHours = Object.keys(userHours).map((name) => ({
      employee: name,
      hours: Math.round((userHours[name] / 3600.0) * 100) / 100,
    }));

    return {
      total_weekly_hours: formatSeconds(totalTrackedSec),
      average_activity_percentage: Math.min(
        100.0,
        Math.round(avgActivity * 100) / 100,
      ),
      most_productive_day: mostProductiveDay,
      total_idle_time: formatSeconds(totalIdleSec),
      attendance_days: attendanceDays,
      app_usage_summary: appUsageSummary,
      daily_productivity_trend: dailyTrend,
      weekly_work_hours: weeklyWorkHours,
    };
  }

  async getMonthlyReportData(
    requestingUser: RequestingUser,
    year: number,
    month: number,
    departmentId?: string,
  ) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    const rows = await this.getDailyReportData(
      requestingUser,
      startDateStr,
      endDateStr,
      undefined,
      departmentId,
    );

    if (rows.length === 0) {
      return {
        total_monthly_work_hours: '00:00:00',
        total_productive_hours: '00:00:00',
        total_idle_hours: '00:00:00',
        attendance_summary: {
          total_sessions: 0,
          avg_sessions_per_day: 0.0,
          unique_days_worked: 0,
        },
        employee_ranking: [],
        productivity_trends: [],
      };
    }

    const totalTrackedSec = rows.reduce(
      (sum, r) => sum + r.raw_tracked_seconds,
      0,
    );
    const totalProductiveSec = rows.reduce(
      (sum, r) => sum + r.raw_productive_seconds,
      0,
    );
    const totalIdleSec = rows.reduce((sum, r) => sum + r.raw_idle_seconds, 0);

    const uniqueDays = new Set(rows.map((r) => r.date)).size;
    const uniqueEmployees = new Set(rows.map((r) => r.user_id)).size;

    const empStats: { [key: string]: any } = {};
    for (const r of rows) {
      const uid = r.user_id;
      if (!empStats[uid]) {
        empStats[uid] = {
          user_id: uid,
          full_name: r.employee_name,
          employee_code: r.employee_code,
          department: r.department,
          productive_sec: 0,
          idle_sec: 0,
          tracked_sec: 0,
        };
      }
      empStats[uid].productive_sec += r.raw_productive_seconds;
      empStats[uid].idle_sec += r.raw_idle_seconds;
      empStats[uid].tracked_sec += r.raw_tracked_seconds;
    }

    const rankings = Object.keys(empStats)
      .map((uid) => {
        const stats = empStats[uid];
        const pct =
          stats.tracked_sec > 0
            ? (stats.productive_sec / stats.tracked_sec) * 100
            : 0.0;

        return {
          user_id: uid,
          full_name: stats.full_name,
          employee_code: stats.employee_code,
          department: stats.department,
          productive_hours:
            Math.round((stats.productive_sec / 3600.0) * 100) / 100,
          tracked_hours: Math.round((stats.tracked_sec / 3600.0) * 100) / 100,
          activity_percentage: Math.min(100.0, Math.round(pct * 100) / 100),
        };
      })
      .sort((a, b) => b.productive_hours - a.productive_hours);

    const trendsGrouped: { [key: string]: any } = {};
    const temp = new Date(start);
    while (temp <= end) {
      const dateStr = temp.toISOString().split('T')[0];
      const dayRows = rows.filter((r) => r.date === dateStr);
      const dayProd =
        dayRows.reduce((sum, r) => sum + r.raw_productive_seconds, 0) / 3600.0;
      const dayIdle =
        dayRows.reduce((sum, r) => sum + r.raw_idle_seconds, 0) / 3600.0;

      trendsGrouped[dateStr] = {
        date: temp.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        productive_hours: Math.round(dayProd * 100) / 100,
        idle_hours: Math.round(dayIdle * 100) / 100,
      };
      temp.setDate(temp.getDate() + 1);
    }

    return {
      total_monthly_work_hours: formatSeconds(totalTrackedSec),
      total_productive_hours: formatSeconds(totalProductiveSec),
      total_idle_hours: formatSeconds(totalIdleSec),
      attendance_summary: {
        total_sessions: rows.length,
        avg_sessions_per_day:
          Math.round((rows.length / Math.max(1, uniqueDays)) * 10) / 10,
        unique_days_worked: uniqueDays,
        active_employees_count: uniqueEmployees,
      },
      employee_ranking: rankings,
      productivity_trends: Object.values(trendsGrouped),
    };
  }

  async getEmployeeAnalyticsData(
    requestingUser: RequestingUser,
    userId: string,
    startDateStr: string,
    endDateStr: string,
  ) {
    await this.resolveAllowedUserIds(requestingUser, userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found.');
    }

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const sessions = await this.prisma.workSession.findMany({
      where: {
        userId,
        startTime: { gte: start, lte: end },
      },
      orderBy: { startTime: 'asc' },
    });

    const userCode = `GS-26-${user.id.substring(0, 4).toUpperCase()}`;
    const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;

    const dailyBreakdown: any[] = [];
    const dateList: Date[] = [];
    const temp = new Date(start);
    while (temp <= end) {
      dateList.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }

    let totalProductiveAll = 0;
    let totalIdleAll = 0;
    let totalDesktopWorkAll = 0;
    let totalPortalActiveAll = 0;
    let totalBreakAll = 0;
    let totalUnaccountedAll = 0;
    let totalEngagementAll = 0;
    let totalBreakCount = 0;

    for (const d of dateList) {
      const daySessions = sessions.filter(
        (s) => s.startTime.toDateString() === d.toDateString(),
      );

      if (daySessions.length === 0) {
        continue;
      }

      const firstLogin = new Date(
        Math.min(...daySessions.map((s) => s.startTime.getTime())),
      );
      const lastActive = new Date(
        Math.max(
          ...daySessions.map((s) => {
            const activeTime = s.endTime || s.updatedAt || s.startTime;
            return activeTime.getTime();
          }),
        ),
      );

      let productiveSec = 0;
      let idleSec = 0;
      let portalActiveSec = 0;

      for (const s of daySessions) {
        const sEnd = s.endTime || s.updatedAt || new Date();
        const sElapsed = Math.max(
          0,
          Math.round((sEnd.getTime() - s.startTime.getTime()) / 1000),
        );

        if (this.isPortalSession(s)) {
          portalActiveSec += sElapsed;
        } else {
          let sProd = Math.max(0, s.productiveTime || 0);
          let sIdle = Math.max(0, s.idleTime || 0);

          if (sProd + sIdle > sElapsed) {
            if (sProd > sElapsed) {
              sProd = sElapsed;
              sIdle = 0;
            } else {
              sIdle = sElapsed - sProd;
            }
          }
          productiveSec += sProd;
          idleSec += sIdle;
        }
      }

      const breakAnalysis = await this.detectBreaksAndGaps(
        user.id,
        d,
        d,
        daySessions,
      );
      const breakCount = breakAnalysis.breakCount;

      const offlineBreakSec = breakAnalysis.breaksList
        .filter((b) => b.type === 'offline')
        .reduce((sum, b) => sum + b.duration, 0);
      const idleBreakSec = breakAnalysis.breaksList
        .filter((b) => b.type === 'idle')
        .reduce((sum, b) => sum + b.duration, 0);

      const reconciledIdleSec = idleSec;
      const reconciledBreakSec = offlineBreakSec + idleBreakSec;

      const spannedDuration = Math.max(
        0,
        Math.round((lastActive.getTime() - firstLogin.getTime()) / 1000),
      );

      const desktopWorkSec = productiveSec + reconciledIdleSec;
      const totalEngagementSec = desktopWorkSec + portalActiveSec;

      const sumAccounted =
        productiveSec +
        reconciledIdleSec +
        portalActiveSec +
        reconciledBreakSec;
      const unaccountedSec = Math.max(0, spannedDuration - sumAccounted);

      const activityPct =
        desktopWorkSec > 0 ? (productiveSec / desktopWorkSec) * 100.0 : 0.0;

      totalProductiveAll += productiveSec;
      totalIdleAll += reconciledIdleSec;
      totalDesktopWorkAll += desktopWorkSec;
      totalPortalActiveAll += portalActiveSec;
      totalBreakAll += reconciledBreakSec;
      totalUnaccountedAll += unaccountedSec;
      totalEngagementAll += totalEngagementSec;
      totalBreakCount += breakCount;

      dailyBreakdown.push({
        employee_name: fullName,
        employee_code: userCode,
        department: user.department?.name || 'General',
        date: d.toISOString().split('T')[0],
        productive_time: formatSeconds(productiveSec),
        idle_time: formatSeconds(reconciledIdleSec),
        desktop_work_time: formatSeconds(desktopWorkSec),
        portal_active_time: formatSeconds(portalActiveSec),
        break_time: formatSeconds(reconciledBreakSec),
        unaccounted_time: formatSeconds(unaccountedSec),
        total_engagement_time: formatSeconds(totalEngagementSec),
        workday_span: formatSeconds(spannedDuration),
        activity_percentage: Math.min(
          100.0,
          Math.round(activityPct * 100) / 100,
        ),
        status: 'Offline',
        first_login: firstLogin.toISOString(),
        last_active: lastActive.toISOString(),
        total_tracked_time: formatSeconds(desktopWorkSec),
        break_count: breakCount,
      });
    }

    const sessionIds = sessions.map((s) => s.id);
    const dbAppUsages = await this.prisma.applicationUsage.findMany({
      where: { workSessionId: { in: sessionIds } },
    });

    const appStats: { [key: string]: any } = {};
    let totalAppSec = 0;
    for (const au of dbAppUsages) {
      const name = au.appName;
      const isProd = au.category !== 'UNPRODUCTIVE';
      if (!appStats[name]) {
        appStats[name] = {
          app_name: name,
          duration_seconds: 0,
          productive_seconds: 0,
          category: isProd ? 'Productive' : 'Non Productive',
          is_productive: isProd,
        };
      }
      appStats[name].duration_seconds += au.duration;
      if (isProd) {
        appStats[name].productive_seconds += au.duration;
      }
      totalAppSec += au.duration;
    }

    const formattedApps = Object.keys(appStats)
      .map((name) => {
        const stats = appStats[name];
        const pct =
          totalAppSec > 0 ? (stats.duration_seconds / totalAppSec) * 100 : 0.0;
        return {
          app_name: stats.app_name,
          total_time: formatSeconds(stats.duration_seconds),
          productive_time: formatSeconds(stats.productive_seconds),
          mouse_moves: 0,
          key_presses: 0,
          category: stats.category,
          is_productive: stats.is_productive,
          percentage_of_total: Math.round(pct * 100) / 100,
        };
      })
      .sort((a, b) => b.percentage_of_total - a.percentage_of_total);

    const breakAnalysisAll = await this.detectBreaksAndGaps(
      userId,
      start,
      end,
      sessions,
    );
    const formattedBreaks = breakAnalysisAll.breaksList.map((b) => ({
      start: b.start.toISOString(),
      end: b.end.toISOString(),
      duration: formatSeconds(b.duration),
      type: b.type,
      description: b.description,
    }));

    const avgActivityAll =
      totalDesktopWorkAll > 0
        ? (totalProductiveAll / totalDesktopWorkAll) * 100
        : 0.0;

    return {
      employee: {
        id: user.id,
        username: user.email,
        full_name: fullName,
        email: user.email,
        employee_code: userCode,
        department: user.department?.name || 'General',
      },
      totals: {
        total_tracked_time: formatSeconds(totalDesktopWorkAll),
        productive_time: formatSeconds(totalProductiveAll),
        idle_time: formatSeconds(totalIdleAll),
        desktop_work_time: formatSeconds(totalDesktopWorkAll),
        portal_active_time: formatSeconds(totalPortalActiveAll),
        break_time: formatSeconds(totalBreakAll),
        unaccounted_time: formatSeconds(totalUnaccountedAll),
        total_engagement_time: formatSeconds(totalEngagementAll),
        activity_percentage: Math.min(
          100.0,
          Math.round(avgActivityAll * 100) / 100,
        ),
        break_count: totalBreakCount,
        total_break_time: formatSeconds(totalBreakAll),
      },
      daily_breakdown: dailyBreakdown,
      app_usage: formattedApps,
      breaks: formattedBreaks,
    };
  }

  async getManagerTeamStatus(
    requestingUser: RequestingUser,
    departmentId?: string,
    teamId?: string,
  ) {
    const allowedUserIds = await this.resolveAllowedUserIds(
      requestingUser,
      undefined,
      departmentId,
      teamId,
    );

    const users = await this.prisma.user.findMany({
      where: { id: { in: allowedUserIds }, deletedAt: null },
      include: { department: true },
    });

    const activeSessions = await this.prisma.workSession.findMany({
      where: { userId: { in: allowedUserIds }, endTime: null },
      orderBy: { startTime: 'desc' },
    });

    const statusList = [];
    const now = new Date();

    for (const user of users) {
      const userCode = `GS-26-${user.id.substring(0, 4).toUpperCase()}`;
      const fullName =
        `${user.firstName} ${user.lastName}`.trim() || user.email;

      const activeSession = activeSessions.find((s) => s.userId === user.id);

      let status = 'Offline';
      let currentApp = 'N/A';
      let currentWindow = 'N/A';
      let elapsedToday = 0;
      let sessionStart: string | null = null;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todaySessions = await this.prisma.workSession.findMany({
        where: {
          userId: user.id,
          startTime: { gte: todayStart, lte: todayEnd },
        },
      });

      for (const s of todaySessions) {
        const sEnd = s.endTime || s.updatedAt || new Date();
        const sElapsed = Math.max(
          0,
          Math.round((sEnd.getTime() - s.startTime.getTime()) / 1000),
        );
        elapsedToday += sElapsed;
      }

      if (user.isTrackingEnabled && activeSession) {
        sessionStart = activeSession.startTime.toISOString();
        const lastUpdate = activeSession.updatedAt || activeSession.startTime;
        const diff = (now.getTime() - lastUpdate.getTime()) / 1000;

        if (diff <= 300) {
          status = 'Active';

          const latestApp = await this.prisma.applicationUsage.findFirst({
            where: { workSessionId: activeSession.id },
            orderBy: { id: 'desc' },
          });
          if (latestApp) {
            currentApp = latestApp.appName;
            currentWindow = latestApp.category || 'Active';
          }
        } else {
          status = 'Idle';
        }
      } else if (!user.isTrackingEnabled) {
        status = 'Disabled';
      }

      statusList.push({
        user_id: user.id,
        username: user.email,
        full_name: fullName,
        employee_code: userCode,
        department: user.department?.name || 'General',
        status,
        current_app: currentApp,
        current_window: currentWindow,
        session_start: sessionStart,
        total_time_today: formatSeconds(elapsedToday),
        raw_total_time_today: elapsedToday,
        is_tracking_enabled: user.isTrackingEnabled,
      });
    }

    return statusList;
  }

  async toggleTracking(userId: string, enabled: boolean, context: any) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('Employee not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isTrackingEnabled: enabled,
      },
    });

    return {
      userId: updated.id,
      email: updated.email,
      is_tracking_enabled: updated.isTrackingEnabled,
    };
  }
}
