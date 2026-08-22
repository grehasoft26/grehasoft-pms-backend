import { ApiKeysService } from '../api-keys/api-keys.service';
import { CreateApiKeyDto } from '../dto/api-keys.dto';
import { hashApiKey } from '../utils/api-key.helper';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      createApiKey: jest.fn().mockImplementation((tenantId, data) =>
        Promise.resolve({
          id: 'key-123',
          name: data.name,
          scopes: data.scopes,
          expiresAt: data.expiresAt,
        }),
      ),
      logAudit: jest.fn().mockResolvedValue(null),
      findApiKeyByHash: jest.fn(),
      updateApiKey: jest.fn().mockResolvedValue(null),
      logApiKeyUsage: jest.fn().mockResolvedValue(null),
      prisma: {
        apiKey: {
          findFirst: jest.fn(),
        },
      },
    };
    service = new ApiKeysService(mockRepository);
  });

  it('should create a raw key prefix and hashed value', async () => {
    const dto: CreateApiKeyDto = { name: 'Test Key', scopes: 'reports:read' };
    const result = await service.create('tenant-1', 'user-1', dto);

    expect(result.rawKey).toBeDefined();
    expect(result.rawKey.startsWith('gsp_')).toBe(true);
    expect(result.name).toBe('Test Key');
    expect(mockRepository.createApiKey).toHaveBeenCalled();
  });

  it('should validate and log usage of a valid key', async () => {
    const rawKey = 'gsp_mytestrawkeyvalue';
    const keyHash = hashApiKey(rawKey);

    mockRepository.findApiKeyByHash.mockResolvedValue({
      id: 'key-123',
      name: 'Test Key',
      keyHash,
      status: 'ACTIVE',
      expiresAt: null,
    });

    const result = await service.validateKey('tenant-1', rawKey);
    expect(result).toBeDefined();
    expect(result.id).toBe('key-123');
    expect(mockRepository.logApiKeyUsage).toHaveBeenCalledWith(
      'tenant-1',
      'key-123',
    );
  });

  it('should invalidate expired keys', async () => {
    const rawKey = 'gsp_expiredkey';
    const keyHash = hashApiKey(rawKey);

    mockRepository.findApiKeyByHash.mockResolvedValue({
      id: 'key-123',
      name: 'Expired Key',
      keyHash,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() - 5000), // expired 5s ago
    });

    const result = await service.validateKey('tenant-1', rawKey);
    expect(result).toBeNull();
    expect(mockRepository.updateApiKey).toHaveBeenCalledWith(
      'tenant-1',
      'key-123',
      { status: 'EXPIRED' },
    );
  });

  it('should rotate keys', async () => {
    mockRepository.prisma.apiKey.findFirst.mockResolvedValue({
      id: 'key-123',
      name: 'Old Key',
      status: 'ACTIVE',
    });

    const result = await service.rotate('tenant-1', 'key-123');
    expect(result.rawKey).toBeDefined();
    expect(mockRepository.updateApiKey).toHaveBeenCalled();
  });

  it('should revoke keys', async () => {
    const result = await service.revoke('tenant-1', 'key-123');
    expect(result.message).toContain('revoked');
    expect(mockRepository.updateApiKey).toHaveBeenCalledWith(
      'tenant-1',
      'key-123',
      { status: 'REVOKED' },
    );
  });
});
