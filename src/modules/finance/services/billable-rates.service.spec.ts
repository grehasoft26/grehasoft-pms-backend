import { Test, TestingModule } from '@nestjs/testing';
import { BillableRatesService } from './billable-rates.service';
import { FinanceRepository } from '../repositories/finance.repository';
import { LoggerService } from '../../../shared/logger/logger.service';

describe('BillableRatesService', () => {
  let service: BillableRatesService;
  let repository: jest.Mocked<FinanceRepository>;

  beforeEach(async () => {
    const mockRepo = {
      findEffectiveRate: jest.fn(),
      findCurrencyById: jest.fn(),
    };

    const mockLogger = {
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillableRatesService,
        { provide: FinanceRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<BillableRatesService>(BillableRatesService);
    repository = module.get(FinanceRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveEffectiveRate', () => {
    it('should return default values if no rate is resolved', async () => {
      repository.findEffectiveRate.mockResolvedValue(null);
      const result = await service.resolveEffectiveRate({
        taskId: 'task-uuid',
      });
      expect(result.rate).toEqual(0.0);
      expect(result.currencyCode).toEqual('INR');
    });

    it('should return resolved rate if found', async () => {
      repository.findEffectiveRate.mockResolvedValue({
        id: 'rate-uuid',
        rate: 150.0,
        currencyId: 'curr-uuid',
        currency: { code: 'USD', exchangeRate: 83.5 },
      } as any);

      const result = await service.resolveEffectiveRate({
        taskId: 'task-uuid',
      });
      expect(result.rate).toEqual(150.0);
      expect(result.currencyCode).toEqual('USD');
    });
  });
});
