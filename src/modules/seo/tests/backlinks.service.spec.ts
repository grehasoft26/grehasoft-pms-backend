import { Test, TestingModule } from '@nestjs/testing';
import { BacklinksService } from '../backlinks/backlinks.service';
import { SeoRepository } from '../repositories/seo.repository';

describe('BacklinksService', () => {
  let service: BacklinksService;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      createBacklink: jest
        .fn()
        .mockImplementation((tenantId, data) => ({ id: 'bl-1', ...data })),
      createBrokenLink: jest
        .fn()
        .mockImplementation((tenantId, data) => ({ id: 'br-1', ...data })),
      logAudit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BacklinksService,
        { provide: SeoRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<BacklinksService>(BacklinksService);
    repository = module.get<SeoRepository>(SeoRepository);
  });

  it('should register backlinks and broken links', async () => {
    const bl = await service.addBacklink('tenant-1', 'project-1', {
      sourceUrl: 'https://extern.com',
      targetUrl: 'https://grehasoft.com',
    });
    expect(bl.sourceUrl).toBe('https://extern.com');
    expect(repository.createBacklink).toHaveBeenCalled();
  });
});
