import { Test, TestingModule } from '@nestjs/testing';
import { DomainsService } from './domains.service';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { BadRequestException } from '@nestjs/common';

describe('DomainsService', () => {
  let service: DomainsService;
  let repository: jest.Mocked<InfrastructureRepository>;

  const mockContext: RequestContext = {
    userId: 'admin-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'corr-uuid',
  };

  beforeEach(async () => {
    const mockRepo = {
      findDomainByName: jest.fn(),
      createDomain: jest.fn(),
      createTimelineEvent: jest.fn(),
      findDomainById: jest.fn(),
      createDnsRecord: jest.fn(),
      deleteDnsRecord: jest.fn(),
    };

    const mockLogger = {
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainsService,
        { provide: InfrastructureRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<DomainsService>(DomainsService);
    repository = module.get(InfrastructureRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerDomain', () => {
    it('should throw BadRequestException if domain already registered', async () => {
      repository.findDomainByName.mockResolvedValue({
        id: 'existing-domain-uuid',
      } as any);

      await expect(
        service.registerDomain(
          {
            name: 'grehasoft.com',
            registrar: 'GoDaddy',
            purchaseDate: '2026-08-06',
            expiryDate: '2027-08-06',
          },
          mockContext,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register domain successfully', async () => {
      repository.findDomainByName.mockResolvedValue(null);
      repository.createDomain.mockResolvedValue({
        id: 'new-domain-uuid',
        name: 'grehasoft.com',
      } as any);

      const result = await service.registerDomain(
        {
          name: 'grehasoft.com',
          registrar: 'GoDaddy',
          purchaseDate: '2026-08-06',
          expiryDate: '2027-08-06',
        },
        mockContext,
      );

      expect(result.id).toEqual('new-domain-uuid');
      expect(repository.createDomain).toHaveBeenCalled();
    });
  });
});
