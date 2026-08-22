import { Test, TestingModule } from '@nestjs/testing';
import { AuditsService } from '../audits/audits.service';
import { SeoRepository } from '../repositories/seo.repository';

describe('AuditsService', () => {
  let service: AuditsService;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      createAudit: jest
        .fn()
        .mockImplementation((tenantId, data) => ({ id: 'audit-1', ...data })),
      createAuditIssue: jest.fn(),
      createRecommendation: jest.fn(),
      logAudit: jest.fn(),
      prisma: {
        crawlLog: {
          create: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditsService,
        { provide: SeoRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AuditsService>(AuditsService);
    repository = module.get<SeoRepository>(SeoRepository);
  });

  it('should run technical audit and calculate correct SEO score', async () => {
    const result = await service.runCrawlAudit('tenant-1', 'project-1');
    expect(result.healthScore).toBeLessThanOrEqual(100);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(repository.createAudit).toHaveBeenCalled();
  });
});
