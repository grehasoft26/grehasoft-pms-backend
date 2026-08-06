import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskTimersRepository } from './task-timers.repository';
import { StartTimerDto, HeartbeatTimerDto } from './dto/task-timers.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { TimeEntriesRepository } from '../time-entries/time-entries.repository';
import { TimeEntryCategory } from '@prisma/client';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TaskTimersService {
  constructor(
    private readonly repository: TaskTimersRepository,
    private readonly entriesRepository: TimeEntriesRepository,
    private readonly logger: LoggerService
  ) {}

  async startTimer(dto: StartTimerDto, context: RequestContext) {
    const active = await this.repository.findActiveTimer(context.userId);
    if (active) {
      throw new BadRequestException('You already have an active running timer');
    }

    const timer = await this.repository.create({
      userId: context.userId,
      taskId: dto.taskId,
      startTime: new Date(),
      description: dto.description || '',
    });

    this.logger.audit(context.userId, 'Start Task Timer', 'taskTimer', timer, { after: timer });
    return timer;
  }

  async pauseTimer(id: string, context: RequestContext) {
    const timer = await this.repository.findById(id);
    if (!timer || timer.userId !== context.userId) {
      throw new NotFoundException('Timer not found');
    }
    if (!timer.isRunning) {
      throw new BadRequestException('Timer is already paused');
    }

    const now = new Date();
    const elapsed = Math.round((now.getTime() - timer.startTime.getTime()) / 1000);
    const accumulatedTime = timer.accumulatedTime + elapsed;

    const updated = await this.repository.update(id, {
      isRunning: false,
      pausedAt: now,
      accumulatedTime,
    });

    return updated;
  }

  async resumeTimer(id: string, context: RequestContext) {
    const timer = await this.repository.findById(id);
    if (!timer || timer.userId !== context.userId) {
      throw new NotFoundException('Timer not found');
    }
    if (timer.isRunning) {
      throw new BadRequestException('Timer is already running');
    }

    const updated = await this.repository.update(id, {
      isRunning: true,
      startTime: new Date(),
      pausedAt: null,
      recoveryFlag: false,
    });

    return updated;
  }

  async stopTimer(id: string, context: RequestContext) {
    const timer = await this.repository.findById(id);
    if (!timer || timer.userId !== context.userId) {
      throw new NotFoundException('Timer not found');
    }

    const now = new Date();
    let duration = timer.accumulatedTime;
    if (timer.isRunning) {
      const elapsed = Math.round((now.getTime() - timer.startTime.getTime()) / 1000);
      duration += elapsed;
    }

    // Single source of truth entry generation
    const entry = await this.entriesRepository.create({
      userId: context.userId,
      taskId: timer.taskId,
      projectId: timer.task.projectId,
      startTime: timer.startTime,
      endTime: now,
      duration,
      description: timer.description,
      billable: true,
      category: TimeEntryCategory.DEVELOPMENT,
    });

    // Delete timer
    await this.repository.delete(id);

    this.logger.audit(context.userId, 'Stop Task Timer & Create TimeEntry', 'timeEntry', entry, { after: entry });
    return entry;
  }

  async sendHeartbeat(id: string, dto: HeartbeatTimerDto, context: RequestContext) {
    const timer = await this.repository.findById(id);
    if (!timer || timer.userId !== context.userId) {
      throw new NotFoundException('Timer not found');
    }

    return this.repository.update(id, {
      accumulatedTime: dto.accumulatedTime,
      lastHeartbeat: new Date(),
    });
  }

  // Heartbeat Recovery handler (runs every 5 mins)
  @Cron('*/5 * * * *')
  async recoverAbandonedTimers() {
    this.logger.log('Checking for abandoned task timers to recover...', 'TaskTimerRecovery');
    const abandoned = await this.repository.findRecoverableTimers();

    for (const timer of abandoned) {
      try {
        const totalDuration = timer.accumulatedTime + Math.round((timer.lastHeartbeat.getTime() - timer.startTime.getTime()) / 1000);
        
        // Save TimeEntry using heartbeat values
        await this.entriesRepository.create({
          userId: timer.userId,
          taskId: timer.taskId,
          projectId: timer.task.projectId,
          startTime: timer.startTime,
          endTime: timer.lastHeartbeat,
          duration: totalDuration > 0 ? totalDuration : 60, // default min 60s
          description: `[AUTO-RECOVERED] ${timer.description || ''}`,
          category: TimeEntryCategory.DEVELOPMENT,
          billable: true,
        });

        // Delete timer
        await this.repository.delete(timer.id);
        this.logger.log(`Recovered timer ${timer.id} for user ${timer.userId}. Logs saved.`, 'TaskTimerRecovery');
      } catch (e) {
        this.logger.error(`Failed to recover timer ${timer.id}: ${e.message}`, 'TaskTimerRecovery');
      }
    }
  }
}
