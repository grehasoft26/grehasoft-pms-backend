import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard/dashboard.service';
import { SeoRepository } from '../repositories/seo.repository';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      findSearchConsole: jest
        .fn()
        .mockResolvedValue([{ clicks: 120, impressions: 1000, position: 2.3 }]),
      prisma: {
        technicalAudit: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ healthScore: 92, pagesCrawled: 45 }),
        },
        backlink: {
          count: jest.fn().mockResolvedValue(15),
        },
        brokenLink: {
          count: jest.fn().mockResolvedValue(2),
        },
        competitor: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: SeoRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    repository = module.get<SeoRepository>(SeoRepository);
  });

  it('should compile aggregate statistics correctly', async () => {
    const stats = await service.getStatistics('tenant-1', 'project-1');
    expect(stats.organicClicks).toBe(120);
    expect(stats.technicalSeoScore).toBe(92);
    expect(stats.backlinksCount).toBe(15);
  });
});
