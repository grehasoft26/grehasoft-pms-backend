import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { WorkSessionsRepository } from './work-sessions.repository';
import {
  StartWorkSessionDto,
  LogBreakDto,
  LogIdleDto,
  LogActivityDto,
  LogAppUsageDto,
  LogWebUsageDto,
  LogScreenshotDto,
  TrackerHeartbeatDto,
  TrackerBatchSyncDto,
} from './dto/work-sessions.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  AttendanceStatus,
  WorkSession,
  BreakSession,
  IdleSession,
  Screenshot,
  ActivityLog,
  ApplicationUsage,
  WebsiteUsage,
} from '@prisma/client';

@Injectable()
export class WorkSessionsService {
  constructor(
    private readonly repository: WorkSessionsRepository,
    private readonly logger: LoggerService,
  ) {}

  classifyAppActivity(
    appName: string,
    windowTitle = '',
  ): 'PRODUCTIVE' | 'UNPRODUCTIVE' {
    const appLower = appName.toLowerCase().trim();
    const titleLower = windowTitle ? windowTitle.toLowerCase() : '';

    if (!appLower || appLower === 'idle' || appLower === 'none') {
      return 'UNPRODUCTIVE';
    }

    const nonProductiveApps = [
      'youtube',
      'facebook',
      'twitter',
      'instagram',
      'netflix',
      'spotify',
      'reddit',
      'pinterest',
      'tumblr',
      'tiktok',
      'vimeo',
      'solitaire',
      'freecell',
      'minesweeper',
      'steam',
      'epic games',
      'origin',
      'uplay',
      'discord',
      'twitch',
      'hulu',
      'disney+',
      'games',
      'game',
    ];

    for (const npApp of nonProductiveApps) {
      if (appLower.includes(npApp)) {
        return 'UNPRODUCTIVE';
      }
    }

    if (
      ['chrome', 'firefox', 'safari', 'edge', 'opera', 'browser'].some((b) =>
        appLower.includes(b),
      )
    ) {
      const nonProductiveSites = [
        'youtube.com',
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'netflix.com',
        'reddit.com',
        'pinterest.com',
        'amazon.in',
        'amazon.com',
        'flipkart.com',
        'ebay.com',
      ];
      for (const site of nonProductiveSites) {
        if (
          titleLower.includes(site) ||
          titleLower.includes(site.split('.')[0])
        ) {
          return 'UNPRODUCTIVE';
        }
      }
      return 'PRODUCTIVE';
    }

    const productiveApps = [
      'code',
      'vs code',
      'vscode',
      'visual studio',
      'cursor',
      'pycharm',
      'intellij',
      'webstorm',
      'eclipse',
      'sublime',
      'notepad++',
      'git',
      'github',
      'gitlab',
      'docker',
      'postman',
      'dbeaver',
      'pgadmin',
      'mysql',
      'terminal',
      'cmd',
      'powershell',
      'bash',
      'zsh',
      'putty',
      'slack',
      'teams',
      'zoom',
      'skype',
      'word',
      'excel',
      'powerpoint',
      'outlook',
      'trello',
      'jira',
      'figma',
      'photoshop',
      'illustrator',
      'grehasoft',
      'localhost',
      'django',
      'react',
      'python',
      'npm',
      'node',
    ];

    for (const pApp of productiveApps) {
      if (appLower.includes(pApp)) {
        return 'PRODUCTIVE';
      }
    }

    return 'PRODUCTIVE';
  }

  async checkAndSplitSession(userId: string): Promise<WorkSession | null> {
    const active = (await this.repository.findActiveSession(
      userId,
    )) as WorkSession | null;
    if (!active) return null;

    const now = new Date();
    const lastActive = active.updatedAt || active.startTime;
    const gapSeconds = Math.round(
      (now.getTime() - lastActive.getTime()) / 1000,
    );

    if (gapSeconds > 300) {
      // Gap > 5 minutes
      // Close the old session at its last active timestamp
      const totalDuration = Math.round(
        (lastActive.getTime() - active.startTime.getTime()) / 1000,
      );
      const cappedDuration = totalDuration >= 0 ? totalDuration : 0;

      const breaks = await this.repository.prisma.breakSession.findMany({
        where: { workSessionId: active.id },
      });
      const breakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0);

      const idles = await this.repository.prisma.idleSession.findMany({
        where: { workSessionId: active.id },
      });
      const idleTime = idles.reduce((sum, i) => sum + (i.duration || 0), 0);

      const maxTracked =
        cappedDuration - breakTime >= 0 ? cappedDuration - breakTime : 0;
      let finalIdle = idleTime;
      let finalProductive = active.productiveTime || 0;
      if (finalProductive + finalIdle > maxTracked) {
        if (finalProductive > maxTracked) {
          finalProductive = maxTracked;
          finalIdle = 0;
        } else {
          finalIdle = maxTracked - finalProductive;
        }
      }
      const finalActive =
        maxTracked - finalIdle >= 0 ? maxTracked - finalIdle : 0;

      // Sum unproductive apps & websites
      const apps = await this.repository.prisma.applicationUsage.findMany({
        where: { workSessionId: active.id, category: 'UNPRODUCTIVE' },
      });
      const webs = await this.repository.prisma.websiteUsage.findMany({
        where: { workSessionId: active.id, category: 'UNPRODUCTIVE' },
      });
      const unproductiveTime =
        apps.reduce((sum, a) => sum + a.duration, 0) +
        webs.reduce((sum, w) => sum + w.duration, 0);

      await this.repository.update(active.id, {
        endTime: lastActive,
        totalDuration: cappedDuration,
        breakTime,
        idleTime: finalIdle,
        activeTime: finalActive,
        productiveTime: finalProductive,
        unproductiveTime,
        attendanceStatus: AttendanceStatus.CHECK_OUT,
      });

      // Create new session starting now
      return await this.repository.create({
        userId,
        startTime: now,
        attendanceStatus: AttendanceStatus.CHECK_IN,
        ipAddress: active.ipAddress,
        userAgent: active.userAgent,
      });
    }

    return active;
  }

  async updateSessionPing(sessionId: string): Promise<void> {
    await this.repository.update(sessionId, {
      updatedAt: new Date(),
    });
  }

  async startSession(
    dto: StartWorkSessionDto,
    context: RequestContext,
  ): Promise<WorkSession> {
    const user = await this.repository.prisma.user.findUnique({
      where: { id: context.userId },
      select: { isTrackingEnabled: true },
    });
    if (!user || !user.isTrackingEnabled) {
      throw new ForbiddenException('Work tracking is disabled for this user');
    }

    const active = await this.repository.findActiveSession(context.userId);
    if (active) {
      throw new BadRequestException('Work session is already active');
    }

    const now = new Date();
    let attendanceStatus: AttendanceStatus = AttendanceStatus.CHECK_IN;
    if (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30)) {
      attendanceStatus = AttendanceStatus.LATE;
    }

    const session = (await this.repository.create({
      userId: context.userId,
      startTime: now,
      attendanceStatus,
      ipAddress: dto.ipAddress || context.ip,
      userAgent: dto.userAgent || context.userAgent,
    })) as WorkSession;

    this.logger.audit(
      context.userId,
      'Start Work Session',
      'workSession',
      session,
      { after: session },
    );
    return session;
  }

  async endSession(context: RequestContext): Promise<WorkSession> {
    const active = (await this.repository.findActiveSession(
      context.userId,
    )) as WorkSession | null;
    if (!active) {
      throw new BadRequestException('No active work session found');
    }

    const now = new Date();
    const totalDuration = Math.round(
      (now.getTime() - active.startTime.getTime()) / 1000,
    );

    const breaks = await this.repository.prisma.breakSession.findMany({
      where: { workSessionId: active.id },
    });
    const breakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0);

    const idles = await this.repository.prisma.idleSession.findMany({
      where: { workSessionId: active.id },
    });
    const idleTime = idles.reduce((sum, i) => sum + (i.duration || 0), 0);

    const maxTracked =
      totalDuration - breakTime >= 0 ? totalDuration - breakTime : 0;
    let finalIdle = idleTime;
    let finalProductive = active.productiveTime || 0;
    if (finalProductive + finalIdle > maxTracked) {
      if (finalProductive > maxTracked) {
        finalProductive = maxTracked;
        finalIdle = 0;
      } else {
        finalIdle = maxTracked - finalProductive;
      }
    }
    const finalActive =
      maxTracked - finalIdle >= 0 ? maxTracked - finalIdle : 0;

    const apps = await this.repository.prisma.applicationUsage.findMany({
      where: { workSessionId: active.id, category: 'UNPRODUCTIVE' },
    });
    const webs = await this.repository.prisma.websiteUsage.findMany({
      where: { workSessionId: active.id, category: 'UNPRODUCTIVE' },
    });
    const unproductiveTime =
      apps.reduce((sum, a) => sum + a.duration, 0) +
      webs.reduce((sum, w) => sum + w.duration, 0);

    let attendanceStatus = active.attendanceStatus;
    if (
      now.getHours() < 17 ||
      (now.getHours() === 17 && now.getMinutes() < 30)
    ) {
      attendanceStatus = AttendanceStatus.EARLY_LEAVE;
    } else {
      attendanceStatus = AttendanceStatus.CHECK_OUT;
    }

    const updated = (await this.repository.update(active.id, {
      endTime: now,
      totalDuration: totalDuration >= 0 ? totalDuration : 0,
      breakTime,
      idleTime: finalIdle,
      activeTime: finalActive,
      productiveTime: finalProductive,
      unproductiveTime,
      attendanceStatus,
    })) as WorkSession;

    this.logger.audit(
      context.userId,
      'End Work Session',
      'workSession',
      updated,
      { before: active, after: updated },
    );
    return updated;
  }

  async getActiveSession(userId: string): Promise<WorkSession> {
    const user = await this.repository.prisma.user.findUnique({
      where: { id: userId },
      select: { isTrackingEnabled: true },
    });
    if (!user || !user.isTrackingEnabled) {
      throw new ForbiddenException('Work tracking is disabled for this user');
    }

    const active = await this.checkAndSplitSession(userId);
    if (!active) {
      throw new NotFoundException('No active work session found');
    }

    return active;
  }

  // Breaks
  async startBreak(
    dto: LogBreakDto,
    context: RequestContext,
  ): Promise<BreakSession> {
    const active = await this.getActiveSession(context.userId);
    const activeBreak = await this.repository.findActiveBreak(active.id);
    if (activeBreak) {
      throw new BadRequestException('A break session is already active');
    }

    const brk = await this.repository.createBreak({
      workSessionId: active.id,
      type: dto.type,
      startTime: new Date(),
      reason: dto.reason,
    });
    await this.updateSessionPing(active.id);
    return brk;
  }

  async endBreak(context: RequestContext): Promise<BreakSession> {
    const active = await this.getActiveSession(context.userId);
    const activeBreak = await this.repository.findActiveBreak(active.id);
    if (!activeBreak) {
      throw new BadRequestException('No active break session found');
    }

    const now = new Date();
    const duration = Math.round(
      (now.getTime() - activeBreak.startTime.getTime()) / 1000,
    );

    const result = await this.repository.updateBreak(activeBreak.id, {
      endTime: now,
      duration,
    });
    await this.updateSessionPing(active.id);
    return result;
  }

  // Idles
  async startIdle(
    dto: LogIdleDto,
    context: RequestContext,
  ): Promise<IdleSession> {
    const active = await this.getActiveSession(context.userId);
    const activeIdle = await this.repository.findActiveIdle(active.id);
    if (activeIdle) {
      throw new BadRequestException('An idle session is already active');
    }

    const result = await this.repository.createIdle({
      workSessionId: active.id,
      type: dto.type,
      startTime: new Date(),
      reason: dto.reason,
    });
    await this.updateSessionPing(active.id);
    return result;
  }

  async endIdle(context: RequestContext): Promise<IdleSession> {
    const active = await this.getActiveSession(context.userId);
    const activeIdle = await this.repository.findActiveIdle(active.id);
    if (!activeIdle) {
      throw new BadRequestException('No active idle session found');
    }

    const now = new Date();
    const duration = Math.round(
      (now.getTime() - activeIdle.startTime.getTime()) / 1000,
    );

    const result = await this.repository.updateIdle(activeIdle.id, {
      endTime: now,
      duration,
    });
    await this.updateSessionPing(active.id);
    return result;
  }

  // Screenshots
  async uploadScreenshot(
    dto: LogScreenshotDto,
    context: RequestContext,
  ): Promise<Screenshot> {
    const active = await this.getActiveSession(context.userId);
    const result = await this.repository.createScreenshot({
      workSessionId: active.id,
      filePath: dto.filePath,
      timestamp: new Date(),
      resolution: dto.resolution,
      monitor: dto.monitor,
      isBlurred: dto.isBlurred,
      isCompressed: dto.isCompressed,
      checksum: dto.checksum,
    });
    await this.updateSessionPing(active.id);
    return result;
  }

  // Activity Logs
  async logActivity(
    dto: LogActivityDto,
    context: RequestContext,
  ): Promise<ActivityLog> {
    const active = await this.getActiveSession(context.userId);
    const totalActions =
      dto.keyboardCount + dto.mouseCount + dto.clicksCount + dto.scrollsCount;
    const activityScore = totalActions > 100 ? 100.0 : totalActions;

    const result = await this.repository.createActivityLog({
      workSessionId: active.id,
      timestamp: new Date(),
      keyboardCount: dto.keyboardCount,
      mouseCount: dto.mouseCount,
      clicksCount: dto.clicksCount,
      scrollsCount: dto.scrollsCount,
      activityScore,
    });
    await this.updateSessionPing(active.id);
    return result;
  }

  // Usages
  async logApplication(
    dto: LogAppUsageDto,
    context: RequestContext,
  ): Promise<ApplicationUsage> {
    const active = await this.getActiveSession(context.userId);
    const category = this.classifyAppActivity(dto.appName);
    const usage = await this.repository.logApplicationUsage({
      workSessionId: active.id,
      appName: dto.appName,
      duration: dto.duration,
      category,
    });

    if (category === 'PRODUCTIVE') {
      await this.repository.update(active.id, {
        productiveTime: { increment: dto.duration },
        updatedAt: new Date(),
      });
    } else {
      await this.repository.update(active.id, {
        unproductiveTime: { increment: dto.duration },
        updatedAt: new Date(),
      });
    }
    return usage;
  }

  async logWebsite(
    dto: LogWebUsageDto,
    context: RequestContext,
  ): Promise<WebsiteUsage> {
    const active = await this.getActiveSession(context.userId);
    const category = this.classifyAppActivity(dto.domain);
    const usage = await this.repository.logWebsiteUsage({
      workSessionId: active.id,
      domain: dto.domain,
      duration: dto.duration,
      category,
    });

    if (category === 'PRODUCTIVE') {
      await this.repository.update(active.id, {
        productiveTime: { increment: dto.duration },
        updatedAt: new Date(),
      });
    } else {
      await this.repository.update(active.id, {
        unproductiveTime: { increment: dto.duration },
        updatedAt: new Date(),
      });
    }
    return usage;
  }

  async getMany(userId?: string): Promise<WorkSession[]> {
    return await this.repository.findMany(userId);
  }

  async autoLogoutInactiveUsers(timeoutMinutes = 15): Promise<number> {
    const timeout = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    const inactiveSessions = await this.repository.prisma.workSession.findMany({
      where: {
        endTime: null,
        updatedAt: { lt: timeout },
      },
    });

    let count = 0;
    for (const session of inactiveSessions) {
      const logoutTime = session.updatedAt || session.startTime;
      const totalDuration = Math.round(
        (logoutTime.getTime() - session.startTime.getTime()) / 1000,
      );

      const breaks = await this.repository.prisma.breakSession.findMany({
        where: { workSessionId: session.id },
      });
      const breakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0);

      const idles = await this.repository.prisma.idleSession.findMany({
        where: { workSessionId: session.id },
      });
      const idleTime = idles.reduce((sum, i) => sum + (i.duration || 0), 0);

      const maxTracked =
        totalDuration - breakTime >= 0 ? totalDuration - breakTime : 0;
      let finalIdle = idleTime;
      let finalProductive = session.productiveTime || 0;
      if (finalProductive + finalIdle > maxTracked) {
        if (finalProductive > maxTracked) {
          finalProductive = maxTracked;
          finalIdle = 0;
        } else {
          finalIdle = maxTracked - finalProductive;
        }
      }
      const finalActive =
        maxTracked - finalIdle >= 0 ? maxTracked - finalIdle : 0;

      const apps = await this.repository.prisma.applicationUsage.findMany({
        where: { workSessionId: session.id, category: 'UNPRODUCTIVE' },
      });
      const webs = await this.repository.prisma.websiteUsage.findMany({
        where: { workSessionId: session.id, category: 'UNPRODUCTIVE' },
      });
      const unproductiveTime =
        apps.reduce((sum, a) => sum + a.duration, 0) +
        webs.reduce((sum, w) => sum + w.duration, 0);

      await this.repository.update(session.id, {
        endTime: logoutTime,
        totalDuration: totalDuration >= 0 ? totalDuration : 0,
        breakTime,
        idleTime: finalIdle,
        activeTime: finalActive,
        productiveTime: finalProductive,
        unproductiveTime,
        attendanceStatus: AttendanceStatus.CHECK_OUT,
      });
      count++;
    }

    return count;
  }

  async cleanupOldSessions(days = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const deleteResult = await this.repository.prisma.workSession.deleteMany({
      where: {
        endTime: {
          not: null,
          lt: cutoffDate,
        },
      },
    });
    return deleteResult.count;
  }

  private async calculateDailyWorkTime(
    userId: string,
  ): Promise<{ elapsedToday: number; formatted: string }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySessions = await this.repository.prisma.workSession.findMany({
      where: {
        userId,
        startTime: { gte: todayStart, lte: todayEnd },
      },
    });

    let elapsedToday = 0;
    for (const s of todaySessions) {
      const sEnd = s.endTime || s.updatedAt || new Date();
      const sElapsed = Math.max(
        0,
        Math.round((sEnd.getTime() - s.startTime.getTime()) / 1000),
      );
      elapsedToday += sElapsed;
    }

    const hrs = Math.floor(elapsedToday / 3600);
    const mins = Math.floor((elapsedToday % 3600) / 60);
    const secs = elapsedToday % 60;
    const formatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return { elapsedToday, formatted };
  }

  async processHeartbeat(dto: TrackerHeartbeatDto, context: RequestContext) {
    let active = await this.repository.prisma.workSession.findFirst({
      where: { userId: context.userId, endTime: null },
    });

    if (!active) {
      const now = new Date();
      let attendanceStatus: AttendanceStatus = AttendanceStatus.CHECK_IN;
      if (
        now.getHours() > 9 ||
        (now.getHours() === 9 && now.getMinutes() > 30)
      ) {
        attendanceStatus = AttendanceStatus.LATE;
      }
      active = await this.repository.create({
        userId: context.userId,
        startTime: now,
        attendanceStatus,
        ipAddress: context.ip,
        userAgent: context.userAgent,
      });
    }

    const now = new Date();
    const durationSeconds = dto.durationSeconds || 60;

    if (dto.mouseMoves || dto.keyPresses || dto.clicks) {
      await this.repository.createActivityLog({
        workSessionId: active.id,
        timestamp: now,
        keyboardCount: dto.keyPresses || 0,
        mouseCount: dto.mouseMoves || 0,
        clicksCount: dto.clicks || 0,
        scrollsCount: 0,
        activityScore: Math.min(
          100.0,
          (dto.keyPresses || 0) + (dto.mouseMoves || 0) + (dto.clicks || 0),
        ),
      });
    }

    const appName = dto.appName || dto.currentApp;
    const windowTitle = dto.windowTitle || dto.currentWindow || '';

    if (appName) {
      const category = this.classifyAppActivity(appName, windowTitle);

      const lastApp = await this.repository.prisma.applicationUsage.findFirst({
        where: { workSessionId: active.id },
        orderBy: { id: 'desc' },
      });

      if (lastApp && lastApp.appName === appName) {
        await this.repository.prisma.applicationUsage.update({
          where: { id: lastApp.id },
          data: { duration: { increment: durationSeconds } },
        });
      } else {
        await this.repository.logApplicationUsage({
          workSessionId: active.id,
          appName,
          duration: durationSeconds,
          category,
        });
      }

      if (category === 'PRODUCTIVE') {
        await this.repository.prisma.workSession.update({
          where: { id: active.id },
          data: {
            productiveTime: { increment: durationSeconds },
            updatedAt: now,
          },
        });
      } else {
        await this.repository.prisma.workSession.update({
          where: { id: active.id },
          data: {
            unproductiveTime: { increment: durationSeconds },
            updatedAt: now,
          },
        });
      }
    } else {
      await this.updateSessionPing(active.id);
    }

    if (dto.isIdle) {
      await this.repository.prisma.workSession.update({
        where: { id: active.id },
        data: {
          idleTime: { increment: durationSeconds },
          updatedAt: now,
        },
      });
    } else {
      await this.repository.prisma.workSession.update({
        where: { id: active.id },
        data: {
          activeTime: { increment: durationSeconds },
          updatedAt: now,
        },
      });
    }

    const updatedSession = await this.repository.prisma.workSession.findUnique({
      where: { id: active.id },
    });

    const { formatted } = await this.calculateDailyWorkTime(context.userId);

    return {
      totalWorkTime: formatted,
      productiveSeconds: updatedSession?.productiveTime || 0,
      idleSeconds: updatedSession?.idleTime || 0,
    };
  }

  async processBatchSync(dto: TrackerBatchSyncDto, context: RequestContext) {
    let active = await this.repository.prisma.workSession.findFirst({
      where: { userId: context.userId, endTime: null },
    });

    if (!active) {
      const now = new Date();
      let attendanceStatus: AttendanceStatus = AttendanceStatus.CHECK_IN;
      if (
        now.getHours() > 9 ||
        (now.getHours() === 9 && now.getMinutes() > 30)
      ) {
        attendanceStatus = AttendanceStatus.LATE;
      }
      active = await this.repository.create({
        userId: context.userId,
        startTime: now,
        attendanceStatus,
        ipAddress: context.ip,
        userAgent: context.userAgent,
      });
    }

    for (const act of dto.activities) {
      const timestamp = new Date(act.timestamp);
      const durationSeconds = act.durationSeconds || 60;

      if (act.mouseMoves || act.keyPresses || act.clicks) {
        await this.repository.createActivityLog({
          workSessionId: active.id,
          timestamp,
          keyboardCount: act.keyPresses || 0,
          mouseCount: act.mouseMoves || 0,
          clicksCount: act.clicks || 0,
          scrollsCount: 0,
          activityScore: Math.min(
            100.0,
            (act.keyPresses || 0) + (act.mouseMoves || 0) + (act.clicks || 0),
          ),
        });
      }

      if (act.appName) {
        const category = this.classifyAppActivity(
          act.appName,
          act.windowTitle || '',
        );

        const lastApp = await this.repository.prisma.applicationUsage.findFirst(
          {
            where: { workSessionId: active.id },
            orderBy: { id: 'desc' },
          },
        );

        if (lastApp && lastApp.appName === act.appName) {
          await this.repository.prisma.applicationUsage.update({
            where: { id: lastApp.id },
            data: { duration: { increment: durationSeconds } },
          });
        } else {
          await this.repository.logApplicationUsage({
            workSessionId: active.id,
            appName: act.appName,
            duration: durationSeconds,
            category,
          });
        }

        if (category === 'PRODUCTIVE') {
          await this.repository.prisma.workSession.update({
            where: { id: active.id },
            data: {
              productiveTime: { increment: durationSeconds },
              updatedAt: new Date(),
            },
          });
        } else {
          await this.repository.prisma.workSession.update({
            where: { id: active.id },
            data: {
              unproductiveTime: { increment: durationSeconds },
              updatedAt: new Date(),
            },
          });
        }
      }

      if (act.isIdle) {
        await this.repository.prisma.workSession.update({
          where: { id: active.id },
          data: {
            idleTime: { increment: durationSeconds },
            updatedAt: new Date(),
          },
        });
      } else {
        await this.repository.prisma.workSession.update({
          where: { id: active.id },
          data: {
            activeTime: { increment: durationSeconds },
            updatedAt: new Date(),
          },
        });
      }
    }

    const updatedSession = await this.repository.prisma.workSession.findUnique({
      where: { id: active.id },
    });

    const { formatted } = await this.calculateDailyWorkTime(context.userId);

    return {
      totalWorkTime: formatted,
      productiveSeconds: updatedSession?.productiveTime || 0,
      idleSeconds: updatedSession?.idleTime || 0,
    };
  }
}
