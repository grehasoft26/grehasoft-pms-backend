import { AnalyticsService } from '../api-analytics/analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      logApiAnalytics: jest.fn().mockResolvedValue(null),
      getAnalytics: jest.fn(),
      prisma: {
        apiLog: {
          create: jest.fn().mockResolvedValue(null),
        },
      },
    };
    service = new AnalyticsService(mockRepository);
  });

  it('should log API gateway request parameters and statuses', async () => {
    await service.logRequest('tenant-1', '/api/v1/reports', 'GET', 150, 200);

    expect(mockRepository.logApiAnalytics).toHaveBeenCalledWith('tenant-1', {
      endpointPath: '/api/v1/reports',
      method: 'GET',
      latencyMs: 150,
      isError: false,
    });
    expect(mockRepository.prisma.apiLog.create).toHaveBeenCalled();
  });

  it('should calculate aggregate dashboard metrics', async () => {
    mockRepository.getAnalytics.mockResolvedValue([
      {
        endpointPath: '/api/v1/reports',
        method: 'GET',
        totalRequests: 10,
        errorRequests: 1,
        avgLatencyMs: 100,
      },
      {
        endpointPath: '/api/v1/tasks',
        method: 'POST',
        totalRequests: 5,
        errorRequests: 0,
        avgLatencyMs: 200,
      },
    ]);

    const stats = await service.getDashboardAnalytics('tenant-1');
    expect(stats.totalApiRequests).toBe(15);
    expect(stats.failedApiRequests).toBe(1);
    expect(stats.errorRate).toBe(6.67);
    expect(stats.averageLatencyMs).toBe(150);
    expect(stats.topEndpoints).toHaveLength(2);
    expect(stats.topEndpoints[0].path).toBe('/api/v1/reports');
  });
});
