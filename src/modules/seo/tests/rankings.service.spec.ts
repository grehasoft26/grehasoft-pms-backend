import { Test, TestingModule } from '@nestjs/testing';
import { RankingsService } from '../rankings/rankings.service';
import { SeoRepository } from '../repositories/seo.repository';

describe('RankingsService', () => {
  let service: RankingsService;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      logKeywordRanking: jest.fn().mockImplementation((tenantId, data) => ({ id: 'rank-1', ...data })),
      findKeywords: jest.fn().mockResolvedValue([
        { id: 'kw-1', term: 'pms' },
        { id: 'kw-2', term: 'software' },
      ]),
      prisma: {
        keywordRanking: {
          findFirst: jest.fn().mockImplementation(({ where }) => {
            if (where.keywordId === 'kw-1') return Promise.resolve({ position: 3 });
            return Promise.resolve({ position: 22 });
          }),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingsService,
        { provide: SeoRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<RankingsService>(RankingsService);
    repository = module.get<SeoRepository>(SeoRepository);
  });

  it('should calculate visibility score matching Top 10 ranks', async () => {
    const res = await service.getVisibilityScore('tenant-1', 'project-1');
    expect(res.visibilityScore).toBe(50); // kw-1 (3) is inside top 10, kw-2 (22) is outside = 50%
  });
});
