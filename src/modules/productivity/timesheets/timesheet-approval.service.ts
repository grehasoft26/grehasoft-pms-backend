import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TimesheetsRepository } from './timesheets.repository';
import { TimesheetStatus } from '@prisma/client';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class TimesheetApprovalService {
  constructor(
    private readonly repository: TimesheetsRepository,
    private readonly logger: LoggerService
  ) {}

  async submitTimesheet(userId: string, startDateStr: string, context: RequestContext) {
    const startDate = new Date(startDateStr);
    const weekly = await this.repository.findWeekly(userId, startDate);
    if (!weekly) {
      throw new NotFoundException('Weekly timesheet not found for specified week');
    }

    if (weekly.status !== TimesheetStatus.DRAFT && weekly.status !== TimesheetStatus.REJECTED) {
      throw new BadRequestException(`Timesheet cannot be submitted from status ${weekly.status}`);
    }

    const updated = await this.repository.updateWeeklyStatus(weekly.id, TimesheetStatus.SUBMITTED);
    this.logger.audit(context.userId, 'Submit Weekly Timesheet', 'weeklyTimesheet', updated, { before: weekly, after: updated });
    return updated;
  }

  async approveTimesheet(timesheetId: string, status: TimesheetStatus, comments: string, context: RequestContext) {
    const weekly = await this.repository.findWeeklyById(timesheetId);
    if (!weekly) {
      throw new NotFoundException('Weekly timesheet not found');
    }

    // Workflow state validation rules
    if (status === TimesheetStatus.MANAGER_APPROVED && weekly.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException('Manager approval requires the timesheet to be submitted first');
    }
    if (status === TimesheetStatus.FINANCE_APPROVED && weekly.status !== TimesheetStatus.MANAGER_APPROVED) {
      throw new BadRequestException('Finance approval requires manager approval first');
    }

    const updated = await this.repository.updateWeeklyStatus(timesheetId, status);

    // Create approval history entry
    await this.repository.createApproval({
      weeklyTimesheetId: timesheetId,
      approverId: context.userId,
      status,
      comments: comments || '',
      actionedAt: new Date(),
    });

    // If completely approved (FINANCE_APPROVED), mark all daily logs and time entries in the week as approved
    if (status === TimesheetStatus.FINANCE_APPROVED) {
      const dailySheets = await this.repository.prisma.dailyTimesheet.findMany({
        where: {
          userId: weekly.userId,
          date: { gte: weekly.startDate, lte: weekly.endDate },
        },
      });

      for (const ds of dailySheets) {
        await this.repository.prisma.dailyTimesheet.update({
          where: { id: ds.id },
          data: { status: TimesheetStatus.FINANCE_APPROVED },
        });

        await this.repository.prisma.timeEntry.updateMany({
          where: { dailyTimesheetId: ds.id },
          data: { approved: true },
        });
      }
    }

    this.logger.audit(context.userId, `Timesheet workflow approval: ${status}`, 'weeklyTimesheet', updated, { before: weekly, after: updated });
    return updated;
  }

  async getPendingApprovals() {
    return this.repository.getPendingWeeklyTimesheets();
  }

  async getTimesheetById(id: string) {
    return this.repository.findWeeklyById(id);
  }
}
