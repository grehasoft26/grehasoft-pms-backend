import { Process, Processor } from '@nestjs/bull';
import * as Bull from 'bull';
import { WebhookService } from '../webhooks/webhook.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReminderService } from '../reminders/reminders.service';

@Processor('notifications')
export class NotificationsProcessor {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly notificationsService: NotificationsService,
    private readonly reminderService: ReminderService
  ) {}

  @Process('send-digest')
  async handleSendDigest(job: Bull.Job<any>) {
    const { userId, tenantId, notifications } = job.data;
    console.log(`[QUEUE WORKER] Processing digest batch of ${notifications.length} for user ${userId}`);

    // Send unified digest Email
    await this.notificationsService.sendNotification(
      tenantId,
      userId,
      'Notification Digest Batch Summary',
      `You have ${notifications.length} batched notifications from quiet hours or digest preferences.`,
      'INFO'
    );
  }

  @Process('webhook-delivery')
  async handleWebhookDelivery(job: Bull.Job<any>) {
    const { tenantId, eventType, payload } = job.data;
    console.log(`[QUEUE WORKER] Triggering outbound Webhook Delivery: ${eventType}`);
    await this.webhookService.triggerEvent(tenantId, eventType, payload);
  }

  @Process('reminder-run')
  async handleReminderRun(job: Bull.Job<any>) {
    const { tenantId } = job.data;
    console.log(`[QUEUE WORKER] Executing dynamic overdue reminders run`);
    await this.reminderService.triggerReminderRuns(tenantId);
  }
}
