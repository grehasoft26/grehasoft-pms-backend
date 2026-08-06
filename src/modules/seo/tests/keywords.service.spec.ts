import { Test, TestingModule } from '@nestjs/testing';
import { KeywordsService } from '../keywords/keywords.service';
import { SeoRepository } from '../repositories/seo.repository';

describe('KeywordsService', () => {
  let service: KeywordsService;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      createKeyword: jest.fn().mockImplementation((tenantId, data) => ({ id: 'kw-1', ...data })),
      findKeywords: jest.fn().mockResolvedValue([]),
      createKeywordGroup: jest.fn().mockImplementation((tenantId, data) => ({ id: 'group-1', ...data })),
      findKeywordGroups: jest.fn().mockResolvedValue([]),
      logAudit: jest.fn(),
      prisma: {
        keywordGroup: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        keyword: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeywordsService,
        { provide: SeoRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<KeywordsService>(KeywordsService);
    repository = module.get<SeoRepository>(SeoRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create keywords and resolve intent automatically', async () => {
    const kw = await service.addKeyword('tenant-1', 'project-1', {
      term: 'buy cheap PMS software online',
    });
    expect(kw.term).toBe('buy cheap PMS software online');
    expect(kw.intent).toBe('TRANSACTIONAL');
    expect(repository.createKeyword).toHaveBeenCalled();
  });
});
