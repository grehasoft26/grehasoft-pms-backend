import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkSessionsRepository } from './work-sessions.repository';
import { StartWorkSessionDto, LogBreakDto, LogIdleDto, LogActivityDto, LogAppUsageDto, LogWebUsageDto, LogScreenshotDto } from './dto/work-sessions.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class WorkSessionsService {
  constructor(
    private readonly repository: WorkSessionsRepository,
    private readonly logger: LoggerService
  ) {}

  async startSession(dto: StartWorkSessionDto, context: RequestContext) {
    const active = await this.repository.findActiveSession(context.userId);
    if (active) {
      throw new BadRequestException('Work session is already active');
    }

    // Determine late check-in if starting after 9:30 AM
    const now = new Date();
    let attendanceStatus: AttendanceStatus = AttendanceStatus.CHECK_IN;
    if (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30)) {
      attendanceStatus = AttendanceStatus.LATE;
    }

    const session = await this.repository.create({
      userId: context.userId,
      startTime: now,
      attendanceStatus,
      ipAddress: dto.ipAddress || context.ip,
      userAgent: dto.userAgent || context.userAgent,
    });

    this.logger.audit(context.userId, 'Start Work Session', 'workSession', session, { after: session });
    return session;
  }

  async endSession(context: RequestContext) {
    const active = await this.repository.findActiveSession(context.userId);
    if (!active) {
      throw new BadRequestException('No active work session found');
    }

    const now = new Date();
    const totalDuration = Math.round((now.getTime() - active.startTime.getTime()) / 1000);

    // Sum breaks
    const breaks = await this.repository.prisma.breakSession.findMany({
      where: { workSessionId: active.id },
    });
    const breakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0);

    // Sum idles
    const idles = await this.repository.prisma.idleSession.findMany({
      where: { workSessionId: active.id },
    });
    const idleTime = idles.reduce((sum, i) => sum + (i.duration || 0), 0);

    const activeTime = totalDuration - breakTime - idleTime >= 0 ? totalDuration - breakTime - idleTime : 0;
    
    // Simple Productivity logic: productiveTime = activeTime - unproductive applications
    const apps = await this.repository.prisma.applicationUsage.findMany({
      where: { workSessionId: active.id, category: 'UNPRODUCTIVE' },
    });
    const webs = await this.repository.prisma.websiteUsage.findMany({
      where: { workSessionId: active.id, category: 'UNPRODUCTIVE' },
    });
    const unproductiveTime = apps.reduce((sum, a) => sum + a.duration, 0) + webs.reduce((sum, w) => sum + w.duration, 0);
    const productiveTime = activeTime - unproductiveTime >= 0 ? activeTime - unproductiveTime : 0;

    // Check early leave: checkout before 5:30 PM
    let attendanceStatus = active.attendanceStatus;
    if (now.getHours() < 17 || (now.getHours() === 17 && now.getMinutes() < 30)) {
      attendanceStatus = AttendanceStatus.EARLY_LEAVE;
    } else {
      attendanceStatus = AttendanceStatus.CHECK_OUT;
    }

    const updated = await this.repository.update(active.id, {
      endTime: now,
      totalDuration,
      breakTime,
      idleTime,
      activeTime,
      productiveTime,
      unproductiveTime,
      attendanceStatus,
    });

    this.logger.audit(context.userId, 'End Work Session', 'workSession', updated, { before: active, after: updated });
    return updated;
  }

  async getActiveSession(userId: string) {
    const active = await this.repository.findActiveSession(userId);
    if (!active) {
      throw new NotFoundException('No active work session found');
    }
    return active;
  }

  // Breaks
  async startBreak(dto: LogBreakDto, context: RequestContext) {
    const active = await this.getActiveSession(context.userId);
    const activeBreak = await this.repository.findActiveBreak(active.id);
    if (activeBreak) {
      throw new BadRequestException('A break session is already active');
    }

    // Auto start idle too
    const brk = await this.repository.createBreak({
      workSessionId: active.id,
      type: dto.type,
      startTime: new Date(),
      reason: dto.reason,
    });

    return brk;
  }

  async endBreak(context: RequestContext) {
    const active = await this.getActiveSession(context.userId);
    const activeBreak = await this.repository.findActiveBreak(active.id);
    if (!activeBreak) {
      throw new BadRequestException('No active break session found');
    }

    const now = new Date();
    const duration = Math.round((now.getTime() - activeBreak.startTime.getTime()) / 1000);

    return this.repository.updateBreak(activeBreak.id, {
      endTime: now,
      duration,
    });
  }

  // Idles
  async startIdle(dto: LogIdleDto, context: RequestContext) {
    const active = await this.getActiveSession(context.userId);
    const activeIdle = await this.repository.findActiveIdle(active.id);
    if (activeIdle) {
      throw new BadRequestException('An idle session is already active');
    }

    return this.repository.createIdle({
      workSessionId: active.id,
      type: dto.type,
      startTime: new Date(),
      reason: dto.reason,
    });
  }

  async endIdle(context: RequestContext) {
    const active = await this.getActiveSession(context.userId);
    const activeIdle = await this.repository.findActiveIdle(active.id);
    if (!activeIdle) {
      throw new BadRequestException('No active idle session found');
    }

    const now = new Date();
    const duration = Math.round((now.getTime() - activeIdle.startTime.getTime()) / 1000);

    return this.repository.updateIdle(activeIdle.id, {
      endTime: now,
      duration,
    });
  }

  // Screenshots
  async uploadScreenshot(dto: LogScreenshotDto, context: RequestContext) {
    const active = await this.getActiveSession(context.userId);
    return this.repository.createScreenshot({
      workSessionId: active.id,
      filePath: dto.filePath,
      timestamp: new Date(),
      resolution: dto.resolution,
      monitor: dto.monitor,
      isBlurred: dto.isBlurred,
      isCompressed: dto.isCompressed,
      checksum: dto.checksum,
    });
  }

  // Activity Logs
  async logActivity(dto: LogActivityDto, context: RequestContext) {
    const active = await this.getActiveSession(context.userId);
    const totalActions = dto.keyboardCount + dto.mouseCount + dto.clicksCount + dto.scrollsCount;
    const activityScore = totalActions > 100 ? 100.00 : totalActions; // simplified scaling out of 100

    return this.repository.createActivityLog({
      workSessionId: active.id,
      timestamp: new Date(),
      keyboardCount: dto.keyboardCount,
      mouseCount: dto.mouseCount,
      clicksCount: dto.clicksCount,
      scrollsCount: dto.scrollsCount,
      activityScore,
    });
  }

  // Usages
  async logApplication(dto: LogAppUsageDto, context: RequestContext) {
    const active = await this.getActiveSession(context.userId);
    return this.repository.logApplicationUsage({
      workSessionId: active.id,
      appName: dto.appName,
      duration: dto.duration,
      category: dto.category,
    });
  }

  async logWebsite(dto: LogWebUsageDto, context: RequestContext) {
    const active = await this.getActiveSession(context.userId);
    return this.repository.logWebsiteUsage({
      workSessionId: active.id,
      domain: dto.domain,
      duration: dto.duration,
      category: dto.category,
    });
  }
}
