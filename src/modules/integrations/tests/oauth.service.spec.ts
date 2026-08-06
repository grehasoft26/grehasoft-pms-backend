import { OAuthService } from '../oauth/oauth.service';
import { CreateOAuthAppDto } from '../dto/oauth.dto';

describe('OAuthService', () => {
  let service: OAuthService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      createOAuthApp: jest.fn().mockImplementation((tenantId, data) => Promise.resolve({ id: 'app-123', name: data.name, clientId: data.clientId, clientSecret: data.clientSecret, redirectUris: data.redirectUris })),
      findOAuthAppByClientId: jest.fn(),
      createOAuthToken: jest.fn().mockImplementation((tenantId, data) => Promise.resolve({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt: data.expiresAt })),
      findOAuthTokenByRefresh: jest.fn(),
      logAudit: jest.fn().mockResolvedValue(null),
      prisma: {
        oAuthToken: {
          update: jest.fn().mockResolvedValue(null),
        },
      },
    };
    service = new OAuthService(mockRepository);
  });

  it('should register oauth application', async () => {
    const dto: CreateOAuthAppDto = { name: 'Test App', redirectUris: 'https://redirect.com/callback' };
    const result = await service.createApplication('tenant-1', 'user-1', dto);

    expect(result.clientId).toBeDefined();
    expect(result.clientSecret).toBeDefined();
    expect(result.name).toBe('Test App');
  });

  it('should exchange code for tokens', async () => {
    mockRepository.findOAuthAppByClientId.mockResolvedValue({
      id: 'app-123',
      name: 'Test App',
      clientId: 'client-id-123',
      clientSecret: 'secret-123',
      redirectUris: 'https://redirect.com/callback',
    });

    const result = await service.generateToken(
      'tenant-1',
      'client-id-123',
      'secret-123',
      'auth-code-123',
      'https://redirect.com/callback'
    );

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockRepository.createOAuthToken).toHaveBeenCalled();
  });

  it('should support token refresh', async () => {
    mockRepository.findOAuthTokenByRefresh.mockResolvedValue({
      id: 'token-123',
      refreshToken: 'old-refresh',
      expiresAt: new Date(Date.now() + 30000),
    });

    const result = await service.refreshToken('tenant-1', 'old-refresh');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockRepository.prisma.oAuthToken.update).toHaveBeenCalled();
  });
});
