import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationsService } from './notifications/notifications.service';
import { PreferencesService } from './preferences/preferences.service';
import { AnnouncementsService } from './announcements/announcements.service';
import { ReminderService } from './reminders/reminders.service';
import { WorkflowEngine } from './approvals/workflow.engine';
import { AutomationEngine } from './automation/automation.service';
import { AutomationHistoryService } from './automation-history/automation-history.service';
import { WebhookService } from './webhooks/webhook.service';
import { DashboardService } from './dashboard/dashboard.service';
import { NotificationTemplateService } from './templates/templates.service';
import { NotificationsProcessor } from './utils/notifications.processor';

import { NotificationsController } from './controllers/notifications.controller';
import { PreferencesController } from './controllers/preferences.controller';
import { AnnouncementsController } from './controllers/announcements.controller';
import { RemindersController } from './controllers/reminders.controller';
import { ApprovalsController } from './controllers/approvals.controller';
import { AutomationHistoryController } from './automation-history/automation-history.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { DashboardController } from './controllers/dashboard.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [
    NotificationsController,
    PreferencesController,
    AnnouncementsController,
    RemindersController,
    ApprovalsController,
    AutomationHistoryController,
    WebhooksController,
    DashboardController,
  ],
  providers: [
    NotificationsRepository,
    NotificationsService,
    PreferencesService,
    AnnouncementsService,
    ReminderService,
    WorkflowEngine,
    AutomationEngine,
    AutomationHistoryService,
    WebhookService,
    DashboardService,
    NotificationTemplateService,
    NotificationsProcessor,
  ],
  exports: [
    NotificationsService,
    PreferencesService,
    AnnouncementsService,
    ReminderService,
    WorkflowEngine,
    AutomationEngine,
    WebhookService,
  ],
})
export class NotificationsModule {}
