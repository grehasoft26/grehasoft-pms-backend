import { WebhooksService } from '../webhooks/webhooks.service';
import { CreateWebhookDto } from '../dto/webhooks.dto';
import { verifyWebhookSignature } from '../utils/signature.helper';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      createWebhook: jest.fn().mockImplementation((tenantId, data) => Promise.resolve({ id: 'webhook-123', name: data.name, targetUrl: data.targetUrl, secretToken: data.secretToken })),
      findWebhookById: jest.fn(),
      logWebhookDelivery: jest.fn().mockImplementation((tenantId, data) => Promise.resolve({ id: 'del-123', success: data.success })),
      logWebhookRetry: jest.fn().mockResolvedValue(null),
      logAudit: jest.fn().mockResolvedValue(null),
      prisma: {
        webhookEvent: {
          create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'event-123', ...args.data })),
        },
      },
    };
    service = new WebhooksService(mockRepository);
  });

  it('should register webhook subscriptions', async () => {
    const dto: CreateWebhookDto = { name: 'Local Webhook', targetUrl: 'https://test.com/hook', eventTypes: 'task.created' };
    const result = await service.create('tenant-1', 'user-1', dto);

    expect(result.id).toBe('webhook-123');
    expect(result.secretToken).toBeDefined();
  });

  it('should dispatch signature headers and log deliveries', async () => {
    const secretToken = 'webhook_secret_key_123';
    mockRepository.findWebhookById.mockResolvedValue({
      id: 'webhook-123',
      targetUrl: 'https://test.com/hook',
      secretToken,
      status: 'ACTIVE',
    });

    const payload = { event: 'task.created', id: 'task-1' };
    const result = await service.sendEvent('tenant-1', 'webhook-123', 'task.created', payload);

    expect(result.success).toBe(true);
    expect(mockRepository.logWebhookDelivery).toHaveBeenCalled();
  });

  it('should verify signatures and detect replay attacks', () => {
    const secret = 'super_secret';
    const payload = '{"event":"test"}';
    const timestamp = Math.floor(Date.now() / 1000);

    const sig = require('../utils/signature.helper').generateWebhookSignature(secret, payload, timestamp);

    // Valid check
    const isValid = verifyWebhookSignature(secret, payload, sig, timestamp);
    expect(isValid).toBe(true);

    // Old timestamp replay attack (6 minutes old)
    const oldTimestamp = timestamp - 360;
    const isOldValid = verifyWebhookSignature(secret, payload, sig, oldTimestamp);
    expect(isOldValid).toBe(false);
  });
});
