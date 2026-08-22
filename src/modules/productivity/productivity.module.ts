import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

import { WorkSessionsController } from './work-sessions/work-sessions.controller';
import { WorkSessionsService } from './work-sessions/work-sessions.service';
import { WorkSessionsRepository } from './work-sessions/work-sessions.repository';

import { TaskTimersController } from './task-timers/task-timers.controller';
import { TaskTimersService } from './task-timers/task-timers.service';
import { TaskTimersRepository } from './task-timers/task-timers.repository';

import { TimeEntriesController } from './time-entries/time-entries.controller';
import { TimeEntriesService } from './time-entries/time-entries.service';
import { TimeEntriesRepository } from './time-entries/time-entries.repository';

import { TimesheetsController } from './timesheets/timesheets.controller';
import { TimesheetApprovalService } from './timesheets/timesheet-approval.service';
import { TimesheetsRepository } from './timesheets/timesheets.repository';

import { ProductivityAnalyticsController } from './analytics/analytics.controller';
import { ProductivityScoreService } from './analytics/productivity-score.service';
import { UtilizationReportService } from './analytics/utilization-report.service';

import { TimeTrackingDashboardController } from './dashboard/dashboard.controller';
import { TimeTrackingDashboardService } from './dashboard/dashboard.service';

@Module({
  imports: [AuthModule],
  controllers: [
    WorkSessionsController,
    TaskTimersController,
    TimeEntriesController,
    TimesheetsController,
    ProductivityAnalyticsController,
    TimeTrackingDashboardController,
  ],
  providers: [
    WorkSessionsService,
    WorkSessionsRepository,
    TaskTimersService,
    TaskTimersRepository,
    TimeEntriesService,
    TimeEntriesRepository,
    TimesheetApprovalService,
    TimesheetsRepository,
    ProductivityScoreService,
    UtilizationReportService,
    TimeTrackingDashboardService,
  ],
  exports: [
    WorkSessionsService,
    TaskTimersService,
    TimeEntriesService,
    TimesheetApprovalService,
    ProductivityScoreService,
    UtilizationReportService,
    TimeTrackingDashboardService,
  ],
})
export class TimeTrackingModule {}
