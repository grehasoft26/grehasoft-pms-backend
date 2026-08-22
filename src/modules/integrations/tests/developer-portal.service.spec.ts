import { DeveloperPortalService } from '../developer-apps/developer-portal.service';

describe('DeveloperPortalService', () => {
  let service: DeveloperPortalService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      createDeveloperApp: jest
        .fn()
        .mockImplementation((tenantId, data) =>
          Promise.resolve({ id: 'app-123', ...data }),
        ),
      findDeveloperApps: jest.fn(),
      createDeveloperTeam: jest
        .fn()
        .mockImplementation((tenantId, name) =>
          Promise.resolve({ id: 'team-123', name }),
        ),
      addDeveloperMember: jest.fn().mockResolvedValue(null),
      createSDKPackage: jest
        .fn()
        .mockImplementation((tenantId, data) =>
          Promise.resolve({ id: 'sdk-123', ...data }),
        ),
      findSDKPackages: jest.fn(),
      logAudit: jest.fn().mockResolvedValue(null),
    };
    service = new DeveloperPortalService(mockRepository);
  });

  it('should register developer portal application with clientId and secret', async () => {
    const result = await service.createApplication('tenant-1', 'user-1', {
      name: 'My Dev App',
      description: 'Internal testing',
    });
    expect(result.clientId).toBeDefined();
    expect(result.clientSecret).toBeDefined();
    expect(result.status).toBe('PENDING');
  });

  it('should register SDK packages and track languages metadata', async () => {
    const result = await service.registerSDKPackage(
      'tenant-1',
      'grehasoft-python-sdk',
      'PYTHON',
      'v1.0.0',
      'https://downloads.com/py',
    );
    expect(result.id).toBe('sdk-123');
    expect(result.language).toBe('PYTHON');
  });
});
