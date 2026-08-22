import { IntegrationsService } from '../integrations/integrations.service';
import { IntegrationProvider } from '@prisma/client';

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let mockRepository: any;
  let mockVaultService: any;

  beforeEach(() => {
    mockRepository = {
      upsertIntegration: jest
        .fn()
        .mockImplementation((tenantId, provider, data) =>
          Promise.resolve({
            id: 'integration-123',
            provider,
            clientId: data.clientId,
          }),
        ),
      upsertIntegrationCredential: jest.fn().mockResolvedValue(null),
      logAudit: jest.fn().mockResolvedValue(null),
    };
    mockVaultService = {
      storeSecret: jest.fn().mockResolvedValue(null),
    };
    service = new IntegrationsService(mockRepository, mockVaultService);
  });

  it('should connect providers and store client keys in vault', async () => {
    const credentials = { apiKey: 'stripe_api_key_xyz' };
    const result = await service.connectProvider(
      'tenant-1',
      IntegrationProvider.STRIPE,
      'stripe-client-1',
      credentials,
    );

    expect(result.id).toBe('integration-123');
    expect(result.clientId).toBe('stripe-client-1');
    expect(mockVaultService.storeSecret).toHaveBeenCalledWith(
      'tenant-1',
      'integration_integration-123_apiKey',
      'API_KEY',
      'stripe_api_key_xyz',
    );
    expect(mockRepository.upsertIntegrationCredential).toHaveBeenCalled();
  });
});
