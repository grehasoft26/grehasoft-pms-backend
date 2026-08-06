import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsRepository } from '../repositories/integrations.repository';
import { CreateWebhookDto } from '../dto/webhooks.dto';
import { generateWebhookSignature, verifyWebhookSignature } from '../utils/signature.helper';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private readonly repository: IntegrationsRepository) {}

  async create(tenantId: string, userId: string, dto: CreateWebhookDto) {
    const secretToken = crypto.randomBytes(32).toString('hex');
    const webhook = await this.repository.createWebhook(tenantId, {
      userId,
      name: dto.name,
      targetUrl: dto.targetUrl,
      eventTypes: dto.eventTypes,
      secretToken,
      status: 'ACTIVE',
    });

    await this.repository.logAudit(tenantId, 'Create Webhook', `Webhook endpoint "${dto.name}" registered.`);
    return webhook;
  }

  async getWebhooks(tenantId: string) {
    return this.repository.findWebhooks(tenantId);
  }

  async sendEvent(tenantId: string, webhookId: string, eventType: string, payload: Record<string, any>) {
    const webhook = await this.repository.findWebhookById(tenantId, webhookId);
    if (!webhook) throw new NotFoundException('Webhook not found');

    const timestamp = Math.floor(Date.now() / 1000);
    const payloadJson = JSON.stringify(payload);
    const signature = generateWebhookSignature(webhook.secretToken, payloadJson, timestamp);

    // Mock outgoing delivery attempt
    let responseStatus = 200;
    let success = true;

    if (webhook.targetUrl.includes('fail')) {
      responseStatus = 500;
      success = false;
    }

    // Create event log
    const eventLog = await this.repository.prisma.webhookEvent.create({
      data: {
        tenantId,
        eventType,
        payloadJson,
      },
    });

    // Create delivery log
    const delivery = await this.repository.logWebhookDelivery(tenantId, {
      webhookEventId: eventLog.id,
      webhookId: webhook.id,
      targetUrl: webhook.targetUrl,
      responseStatus,
      responseBody: success ? '{"received": true}' : '{"error": "Internal Server Error"}',
      duration: 120,
      success,
      retryCount: 0,
    });

    // If failed, schedule retry
    if (!success) {
      await this.repository.logWebhookRetry(tenantId, {
        webhookId: webhook.id,
        targetUrl: webhook.targetUrl,
        payloadJson,
        attemptCount: 1,
        nextAttemptAt: new Date(Date.now() + 10000), // Retry in 10 seconds (exponential backoff simulated)
        status: 'PENDING',
      });
    }

    await this.repository.logAudit(tenantId, 'Dispatch Webhook Event', `Webhook event ${eventType} sent to targetUrl: ${webhook.targetUrl}`);
    return { success, deliveryId: delivery.id, eventId: eventLog.id };
  }
}
