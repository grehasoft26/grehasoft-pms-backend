import { Test, TestingModule } from '@nestjs/testing';
import { LedgerAccountingService } from './ledger-accounting.service';
import { FinanceRepository } from '../repositories/finance.repository';
import { BadRequestException } from '@nestjs/common';

describe('LedgerAccountingService', () => {
  let service: LedgerAccountingService;
  let repository: jest.Mocked<FinanceRepository>;

  beforeEach(async () => {
    const mockRepo = {
      getLastJournalEntryNumber: jest.fn(),
      findLedgerAccountByCode: jest.fn(),
      updateLedgerAccountBalance: jest.fn(),
      createJournalEntry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerAccountingService,
        { provide: FinanceRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<LedgerAccountingService>(LedgerAccountingService);
    repository = module.get(FinanceRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('postJournalEntry', () => {
    it('should throw BadRequestException if debits and credits do not balance', async () => {
      await expect(
        service.postJournalEntry(
          'Unbalanced entry',
          [{ accountCode: '1010', amount: 100 }],
          [{ accountCode: '4000', amount: 150 }]
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should post entry successfully if balanced', async () => {
      repository.getLastJournalEntryNumber.mockResolvedValue(null);
      repository.findLedgerAccountByCode.mockImplementation(async (code) => ({
        id: `acc-${code}`,
        code,
        name: 'Account',
        type: code === '1010' ? 'ASSET' : 'REVENUE',
        balance: 1000.00,
      } as any));

      repository.createJournalEntry.mockResolvedValue({ id: 'je-uuid' } as any);

      const result = await service.postJournalEntry(
        'Balanced entry',
        [{ accountCode: '1010', amount: 100 }],
        [{ accountCode: '4000', amount: 100 }]
      );

      expect(result.id).toEqual('je-uuid');
      expect(repository.createJournalEntry).toHaveBeenCalled();
    });
  });
});
