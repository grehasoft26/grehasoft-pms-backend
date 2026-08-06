import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { FinanceRepository } from '../repositories/finance.repository';
import { LedgerAccountingService } from './ledger-accounting.service';
import { BillableRatesService } from './billable-rates.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { InvoiceStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let repository: jest.Mocked<FinanceRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-uuid',
  };

  const mockInvoice: any = {
    id: 'invoice-uuid',
    invoiceNumber: 'INV-2026-000001',
    status: InvoiceStatus.DRAFT,
    total: 1000.00,
    balanceDue: 1000.00,
  };

  beforeEach(async () => {
    const mockRepo = {
      createInvoice: jest.fn(),
      updateInvoice: jest.fn(),
      findInvoiceById: jest.fn(),
      getLastInvoiceNumber: jest.fn(),
      createInvoiceTimeline: jest.fn(),
      createPayment: jest.fn(),
      createPaymentAllocation: jest.fn(),
      prisma: {
        timeEntry: { findMany: jest.fn(), updateMany: jest.fn() },
      },
    };

    const mockAccounting = {
      postJournalEntry: jest.fn(),
    };

    const mockRates = {
      resolveEffectiveRate: jest.fn(),
    };

    const mockLogger = {
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: FinanceRepository, useValue: mockRepo },
        { provide: LedgerAccountingService, useValue: mockAccounting },
        { provide: BillableRatesService, useValue: mockRates },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    repository = module.get(FinanceRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markAsSent', () => {
    it('should finalize draft invoice successfully', async () => {
      repository.findInvoiceById.mockResolvedValue(mockInvoice);
      repository.updateInvoice.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });

      const result = await service.markAsSent('invoice-uuid', mockContext);
      expect(result.status).toEqual(InvoiceStatus.SENT);
      expect(repository.updateInvoice).toHaveBeenCalled();
    });

    it('should throw BadRequestException if already sent', async () => {
      repository.findInvoiceById.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });
      await expect(service.markAsSent('invoice-uuid', mockContext)).rejects.toThrow(BadRequestException);
    });
  });
});
