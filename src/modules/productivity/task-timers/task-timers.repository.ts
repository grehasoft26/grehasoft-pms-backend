import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskTimersRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.TaskTimerUncheckedCreateInput) {
    return this.prisma.taskTimer.create({
      data,
      include: {
        task: { select: { id: true, code: true, title: true, projectId: true } },
      },
    });
  }

  async findActiveTimer(userId: string) {
    return this.prisma.taskTimer.findFirst({
      where: { userId, isRunning: true },
      include: {
        task: { select: { id: true, code: true, title: true, projectId: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.taskTimer.findUnique({
      where: { id },
      include: {
        task: true,
      },
    });
  }

  async findRecoverableTimers() {
    // Timers that are running but haven't received a heartbeat in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.prisma.taskTimer.findMany({
      where: {
        isRunning: true,
        lastHeartbeat: { lt: fiveMinutesAgo },
      },
      include: {
        task: { select: { id: true, code: true, title: true, projectId: true } },
      },
    });
  }

  async update(id: string, data: Prisma.TaskTimerUncheckedUpdateInput) {
    return this.prisma.taskTimer.update({
      where: { id },
      data,
      include: {
        task: { select: { id: true, code: true, title: true, projectId: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.taskTimer.delete({
      where: { id },
    });
  }
}
