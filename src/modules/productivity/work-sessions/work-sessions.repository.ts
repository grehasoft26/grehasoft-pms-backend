import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorkSessionsRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.WorkSessionUncheckedCreateInput) {
    return this.prisma.workSession.create({
      data,
      include: {
        breaks: true,
        idles: true,
        screenshots: true,
        activityLogs: true,
        applications: true,
        websites: true,
      },
    });
  }

  async findActiveSession(userId: string) {
    return this.prisma.workSession.findFirst({
      where: { userId, endTime: null },
      include: {
        breaks: true,
        idles: true,
        screenshots: true,
        activityLogs: true,
        applications: true,
        websites: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.workSession.findUnique({
      where: { id },
      include: {
        breaks: true,
        idles: true,
        screenshots: true,
        activityLogs: true,
        applications: true,
        websites: true,
      },
    });
  }

  async findMany(userId?: string) {
    return this.prisma.workSession.findMany({
      where: userId ? { userId } : {},
      orderBy: { startTime: 'desc' },
      include: {
        breaks: true,
        idles: true,
      },
    });
  }

  async update(id: string, data: Prisma.WorkSessionUncheckedUpdateInput) {
    return this.prisma.workSession.update({
      where: { id },
      data,
      include: {
        breaks: true,
        idles: true,
      },
    });
  }

  // Breaks
  async createBreak(data: Prisma.BreakSessionUncheckedCreateInput) {
    return this.prisma.breakSession.create({ data });
  }

  async findActiveBreak(workSessionId: string) {
    return this.prisma.breakSession.findFirst({
      where: { workSessionId, endTime: null },
    });
  }

  async updateBreak(id: string, data: Prisma.BreakSessionUncheckedUpdateInput) {
    return this.prisma.breakSession.update({
      where: { id },
      data,
    });
  }

  // Idles
  async createIdle(data: Prisma.IdleSessionUncheckedCreateInput) {
    return this.prisma.idleSession.create({ data });
  }

  async findActiveIdle(workSessionId: string) {
    return this.prisma.idleSession.findFirst({
      where: { workSessionId, endTime: null },
    });
  }

  async updateIdle(id: string, data: Prisma.IdleSessionUncheckedUpdateInput) {
    return this.prisma.idleSession.update({
      where: { id },
      data,
    });
  }

  // Screenshots
  async createScreenshot(data: Prisma.ScreenshotUncheckedCreateInput) {
    return this.prisma.screenshot.create({ data });
  }

  // ActivityLogs
  async createActivityLog(data: Prisma.ActivityLogUncheckedCreateInput) {
    return this.prisma.activityLog.create({ data });
  }

  // Applications Usage
  async logApplicationUsage(data: Prisma.ApplicationUsageUncheckedCreateInput) {
    return this.prisma.applicationUsage.create({ data });
  }

  // Websites Usage
  async logWebsiteUsage(data: Prisma.WebsiteUsageUncheckedCreateInput) {
    return this.prisma.websiteUsage.create({ data });
  }
}
