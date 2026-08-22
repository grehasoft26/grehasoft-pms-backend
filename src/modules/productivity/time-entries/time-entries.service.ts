import { Injectable, NotFoundException } from '@nestjs/common';
import { TimeEntriesRepository } from './time-entries.repository';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/time-entries.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { TimesheetsRepository } from '../timesheets/timesheets.repository';

@Injectable()
export class TimeEntriesService {
  constructor(
    private readonly repository: TimeEntriesRepository,
    private readonly timesheetsRepository: TimesheetsRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateTimeEntryDto, context: RequestContext) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const duration = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000,
    );

    const entry = await this.repository.create({
      userId: context.userId,
      taskId: dto.taskId,
      projectId: dto.projectId,
      startTime,
      endTime,
      duration,
      description: dto.description || '',
      billable: dto.billable ?? true,
      category: dto.category,
      isManual: dto.isManual ?? true,
    });

    await this.recalculateTimesheets(context.userId, startTime);

    this.logger.audit(context.userId, 'Create Time Entry', 'timeEntry', entry, {
      after: entry,
    });
    return entry;
  }

  async getMany(filters: {
    userId?: string;
    projectId?: string;
    taskId?: string;
    approved?: boolean;
  }) {
    return this.repository.findMany(filters);
  }

  async getById(id: string) {
    const entry = await this.repository.findById(id);
    if (!entry)
      throw new NotFoundException(`TimeEntry with ID ${id} not found`);
    return entry;
  }

  async update(id: string, dto: UpdateTimeEntryDto, context: RequestContext) {
    const before = await this.getById(id);

    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : before.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : before.endTime;
    const duration =
      dto.startTime || dto.endTime
        ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
        : before.duration;

    const updated = await this.repository.update(id, {
      taskId: dto.taskId,
      projectId: dto.projectId,
      startTime,
      endTime,
      duration,
      description: dto.description,
      billable: dto.billable,
      category: dto.category,
    });

    await this.recalculateTimesheets(context.userId, startTime);

    this.logger.audit(
      context.userId,
      'Update Time Entry',
      'timeEntry',
      updated,
      { before, after: updated },
    );
    return updated;
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id);
    await this.recalculateTimesheets(context.userId, before.startTime);
    this.logger.audit(
      context.userId,
      'Delete Time Entry',
      'timeEntry',
      { id },
      { before },
    );
  }

  // Recalculate daily and weekly timesheet aggregates from single-source-of-truth entries
  private async recalculateTimesheets(userId: string, date: Date) {
    // 1. Recalculate DailyTimesheet
    const dailySums = await this.repository.getDailySum(userId, date);
    const dailyTimesheet = await this.timesheetsRepository.upsertDaily(
      userId,
      date,
      dailySums.totalHours,
      dailySums.billableHours,
    );

    // Link entries to the dailyTimesheet
    for (const entry of dailySums.entries) {
      await this.repository.prisma.timeEntry.update({
        where: { id: entry.id },
        data: { dailyTimesheetId: dailyTimesheet.id },
      });
    }

    // 2. Recalculate WeeklyTimesheet
    // Find Monday of the current week
    const currentMonday = new Date(date);
    const day = currentMonday.getDay();
    const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const sunday = new Date(currentMonday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Sum all daily hours for this user within this week
    const dailySheets = await this.repository.prisma.dailyTimesheet.findMany({
      where: {
        userId,
        date: { gte: currentMonday, lte: sunday },
      },
    });

    const weeklyTotal = dailySheets.reduce(
      (sum, ds) => sum + Number(ds.totalHours),
      0,
    );

    await this.timesheetsRepository.upsertWeekly(
      userId,
      currentMonday,
      sunday,
      weeklyTotal,
    );
  }
}
