import { SecretVaultService } from '../secrets/secret-vault.service';
import { RateLimiterService } from '../rate-limits/rate-limiter.service';
import { SecretType } from '@prisma/client';

describe('Vault and Rate Limiter Services', () => {
  let vaultService: SecretVaultService;
  let rateLimiter: RateLimiterService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      upsertSecret: jest
        .fn()
        .mockImplementation(
          (tenantId, secretName, secretType, encryptedPayload) =>
            Promise.resolve({
              id: 'vault-123',
              secretName,
              secretType,
              encryptedPayload,
            }),
        ),
      findSecret: jest.fn(),
      logAudit: jest.fn().mockResolvedValue(null),
    };
    vaultService = new SecretVaultService(mockRepository);
    rateLimiter = new RateLimiterService();
  });

  it('should encrypt and decrypt payload credentials correctly', async () => {
    const originalText = 'my-super-secret-stripe-token';
    let storedEncryptedPayload = '';

    mockRepository.upsertSecret.mockImplementation(
      (tenantId, name, type, encrypted) => {
        storedEncryptedPayload = encrypted;
        return Promise.resolve({
          id: 'vault-123',
          secretName: name,
          secretType: type,
          encryptedPayload: encrypted,
        });
      },
    );

    await vaultService.storeSecret(
      'tenant-1',
      'stripe_key',
      SecretType.API_KEY,
      originalText,
    );
    expect(storedEncryptedPayload).toBeDefined();
    expect(storedEncryptedPayload).not.toBe(originalText);

    mockRepository.findSecret.mockResolvedValue({
      id: 'vault-123',
      secretName: 'stripe_key',
      secretType: SecretType.API_KEY,
      encryptedPayload: storedEncryptedPayload,
    });

    const decryptedText = await vaultService.getSecret(
      'tenant-1',
      'stripe_key',
      SecretType.API_KEY,
    );
    expect(decryptedText).toBe(originalText);
  });

  it('should enforce sliding window rate limiting limits correctly', async () => {
    // Under 5 requests check
    for (let i = 0; i < 3; i++) {
      const res = await rateLimiter.enforceLimit('user-1-ip', 5, 60);
      expect(res.isAllowed).toBe(true);
    }

    // Exceeding check
    let threw = false;
    try {
      for (let i = 0; i < 5; i++) {
        await rateLimiter.enforceLimit('user-1-ip', 5, 60);
      }
    } catch (e) {
      threw = true;
      expect(e.status).toBe(429);
    }
    expect(threw).toBe(true);
  });
});
