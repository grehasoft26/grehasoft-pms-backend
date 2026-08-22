import { Injectable, BadRequestException } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import {
  NotificationChannel,
  NotificationType,
  NotificationStatus,
} from '@prisma/client';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly logger: LoggerService,
  ) {}

  isInsideQuietHours(
    timezone: string,
    startStr?: string | null,
    endStr?: string | null,
  ): boolean {
    if (!startStr || !endStr) return false;
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone || 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(new Date());
      const hour = parts.find((p) => p.type === 'hour')?.value || '00';
      const minute = parts.find((p) => p.type === 'minute')?.value || '00';
      const currentStr = `${hour}:${minute}`;

      if (startStr <= endStr) {
        return currentStr >= startStr && currentStr <= endStr;
      } else {
        return currentStr >= startStr || currentStr <= endStr;
      }
    } catch (e) {
      return false;
    }
  }

  async sendNotification(
    tenantId: string,
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    context?: RequestContext,
  ) {
    // 1. Get user preferences
    const prefs = await this.repository.findPreferences(tenantId, userId);

    // 2. Default preferences if empty
    const channels =
      prefs.length > 0
        ? prefs.filter((p) => p.enabled).map((p) => p.channel)
        : [NotificationChannel.IN_APP, NotificationChannel.EMAIL];

    const digestFreq = prefs[0]?.digestFrequency || 'IMMEDIATE';
    const qStart = prefs[0]?.quietHoursStart;
    const qEnd = prefs[0]?.quietHoursEnd;
    const tz = prefs[0]?.timezone || 'UTC';

    const quiet = this.isInsideQuietHours(tz, qStart, qEnd);
    const mustQueue = quiet || digestFreq !== 'IMMEDIATE';

    const payload = { title, message, type, channels };

    if (mustQueue) {
      // Add to database NotificationQueue
      await this.repository.prisma.notificationQueue.create({
        data: {
          tenantId,
          channel: NotificationChannel.IN_APP, // or specific channel
          payloadJson: JSON.stringify(payload),
          nextRunAt: new Date(Date.now() + 60000), // process in 1 min
          status: 'PENDING',
        },
      });

      await this.repository.logAudit(
        tenantId,
        'Queue Notification',
        `Queued notification: ${title} due to quiet hours or digest settings.`,
      );
      return {
        status: 'QUEUED',
        message: 'Notification queued due to quiet hours or digest settings',
      };
    }

    // 3. Dispatch IMMEDIATE
    const results: any[] = [];
    for (const channel of channels) {
      if (channel === NotificationChannel.IN_APP) {
        const notif = await this.repository.createNotification(tenantId, {
          userId,
          title,
          message,
          type,
          status: 'PENDING',
        });
        results.push({ channel, id: notif.id });
      } else {
        // SMS, EMAIL, WHATSAPP, PUSH gateways simulation
        const sentSuccess = true; // simulation
        const log = await this.repository.logCommunication(tenantId, {
          userId,
          channel,
          recipient: 'recipient@grehasoft.com',
          subject: title,
          body: message,
          status: sentSuccess ? 'SENT' : 'FAILED',
          sentAt: new Date(),
        });
        results.push({ channel, logId: log.id });
      }
    }

    await this.repository.logAudit(
      tenantId,
      'Dispatch Notification',
      `Immediate dispatch completed for user ${userId}.`,
    );
    return { status: 'DISPATCHED', results };
  }

  // Notification Center REST APIs
  async getNotifications(tenantId: string, userId: string, unreadOnly = false) {
    return this.repository.findNotifications(tenantId, userId, unreadOnly);
  }

  async markRead(tenantId: string, id: string) {
    return this.repository.markAsRead(tenantId, id);
  }

  async markClicked(tenantId: string, id: string) {
    return this.repository.markAsClicked(tenantId, id);
  }

  async archive(tenantId: string, id: string) {
    return this.repository.archiveNotification(tenantId, id);
  }
}
