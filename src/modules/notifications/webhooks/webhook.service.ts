import { Injectable, Logger } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { RegisterWebhookDto } from '../dto/webhooks.dto';
import { EventSubscription } from '@prisma/client';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly repository: NotificationsRepository) {}

  async registerSubscription(tenantId: string, dto: RegisterWebhookDto) {
    return this.repository.createSubscription(tenantId, {
      name: dto.name,
      targetUrl: dto.targetUrl,
      eventTypes: dto.eventTypes,
      secretToken: dto.secretToken,
      isActive: true,
    });
  }

  async getSubscriptions(tenantId: string) {
    return this.repository.findSubscriptions(tenantId);
  }

  async triggerEvent(tenantId: string, eventType: string, payload: any) {
    // 1. Create WebhookEvent log
    const eventLog = await this.repository.logWebhookEvent(tenantId, {
      eventType,
      payloadJson: JSON.stringify(payload),
    });

    // 2. Fetch subscriptions matching event type
    const subscriptions = await this.getSubscriptions(tenantId);
    const targets = subscriptions.filter((s: EventSubscription) =>
      s.eventTypes.split(',').includes(eventType),
    );

    const deliveries: any[] = [];

    for (const sub of targets) {
      const startTime = Date.now();
      let success = false;
      let status: number | null = null;
      let responseBody = '';
      let errorMsg = '';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(sub.targetUrl, {
          method: 'POST',
          headers: {
            'X-Grehasoft-Signature': sub.secretToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        status = res.status;
        responseBody = await res.text();
        success = res.ok;
      } catch (err: any) {
        errorMsg = err.message || 'Webhook Post Timeout';
        success = false;
      }

      const duration = Date.now() - startTime;

      const delivery = await this.repository.logWebhookDelivery(tenantId, {
        webhookEventId: eventLog.id,
        targetUrl: sub.targetUrl,
        responseStatus: status,
        responseBody: responseBody || errorMsg,
        duration,
        success,
        retryCount: 0,
      });

      deliveries.push(delivery);
    }

    return {
      eventId: eventLog.id,
      deliveriesCount: deliveries.length,
      deliveries,
    };
  }
}
