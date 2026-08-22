import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '../../shared/logger/logger.service';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../../modules/notifications/notifications/notifications.service';
import { ReminderService } from '../../modules/notifications/reminders/reminders.service';
import { WorkSessionsService } from '../../modules/productivity/work-sessions/work-sessions.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly reminderService: ReminderService,
    private readonly workSessionsService: WorkSessionsService,
  ) {}

  // 1. Auto logout checks - runs every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoLogoutCheck() {
    this.logger.log(
      'Checking for inactive user sessions to auto-logout...',
      'SchedulerService',
    );
    try {
      const loggedOutCount =
        await this.workSessionsService.autoLogoutInactiveUsers(15);
      this.logger.log(
        `Auto-logged out ${loggedOutCount} inactive users`,
        'SchedulerService',
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.stack : String(err);
      this.logger.error(
        'Failed to run auto-logout checks',
        errMsg,
        'SchedulerService',
      );
    }
  }

  // 2. Domain expiry audits - runs daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDomainExpiryCheck() {
    this.logger.log('Auditing domain expiration dates...', 'SchedulerService');
    try {
      const now = new Date();
      // const thirtyDaysFromNow = new Date(
      //   now.getTime() + 30 * 24 * 60 * 60 * 1000,
      // );

      const domains = await this.prisma.domain.findMany({
        where: {
          status: 'ACTIVE',
        },
      });

      const adminUsers = await this.prisma.user.findMany({
        where: {
          role: {
            name: 'Super Admin',
          },
          deletedAt: null,
        },
      });

      for (const domain of domains) {
        if (!domain.expiryDate) continue;
        const expiry = new Date(domain.expiryDate);
        const timeDiff = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        let title = '';
        let message = '';
        let shouldAlert = false;

        if (diffDays <= 0) {
          title = `Domain Expired: ${domain.name}`;
          message = `Domain ${domain.name} expired on ${domain.expiryDate.toISOString().split('T')[0]}. Action required immediately.`;
          shouldAlert = true;
        } else if (diffDays <= 30) {
          title = `Domain Expiring Soon: ${domain.name}`;
          message = `Domain ${domain.name} expires on ${domain.expiryDate.toISOString().split('T')[0]} (${diffDays} days remaining).`;
          shouldAlert = true;
        }

        if (shouldAlert) {
          for (const admin of adminUsers) {
            await this.notificationsService.sendNotification(
              'default',
              admin.id,
              title,
              message,
              NotificationType.WARNING,
            );
          }
        }
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.stack : String(e);
      this.logger.error(
        'Failed to run daily domain expiry audit',
        errMsg,
        'SchedulerService',
      );
    }
  }

  // 3. Database cleanup of old screenshots - runs daily at 2:00 AM
  @Cron('0 2 * * *')
  async handleOldScreenshotsCleanup() {
    this.logger.log(
      'Executing database cleanup task for old screenshots...',
      'SchedulerService',
    );
    try {
      const deletedSessionsCount =
        await this.workSessionsService.cleanupOldSessions(90);
      this.logger.log(
        `Cleaned up ${deletedSessionsCount} old work sessions older than 90 days`,
        'SchedulerService',
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.stack : String(err);
      this.logger.error(
        'Failed to run old sessions database cleanup',
        errMsg,
        'SchedulerService',
      );
    }
  }

  // 4. Daily work logs report consolidation - runs daily at 11:30 PM
  @Cron('30 23 * * *')
  handleDailySeoLogsConsolidation() {
    this.logger.log(
      'Consolidating SEO work logs for daily reporting...',
      'SchedulerService',
    );
    // Logic will be wired when SEO module is active
  }

  // 5. Periodic reminders check run - runs every minute
  @Cron('0 * * * * *')
  async handlePeriodicRemindersCheck() {
    this.logger.log('Auditing scheduled reminders...', 'SchedulerService');
    try {
      await this.reminderService.processReminderAlerts();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.stack : String(e);
      this.logger.error(
        'Failed to run periodic reminders check',
        errMsg,
        'SchedulerService',
      );
    }
  }
}
