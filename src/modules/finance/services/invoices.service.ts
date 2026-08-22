import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FinanceRepository } from '../repositories/finance.repository';
import { LedgerAccountingService } from './ledger-accounting.service';
import { BillableRatesService } from './billable-rates.service';
import {
  CreateInvoiceDto,
  GenerateTimeEntryInvoiceDto,
  AddPaymentDto,
} from '../dto/invoices.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { InvoiceStatus, InvoiceItemType } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly repository: FinanceRepository,
    private readonly accountingService: LedgerAccountingService,
    private readonly ratesService: BillableRatesService,
    private readonly logger: LoggerService,
  ) {}

  private async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastInvoice = await this.repository.getLastInvoiceNumber(year);
    let nextNum = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split('-');
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }
    return `INV-${year}-${String(nextNum).padStart(6, '0')}`;
  }

  async createInvoice(dto: CreateInvoiceDto, context: RequestContext) {
    const invoiceNumber = await this.getNextInvoiceNumber();

    let subtotal = 0;
    const items = dto.items.map((it) => {
      const total = it.quantity * it.rate - (it.discount || 0) + (it.tax || 0);
      subtotal += total;
      return {
        type: it.type,
        timeEntryId: it.timeEntryId,
        taskId: it.taskId,
        description: it.description,
        quantity: it.quantity,
        rate: it.rate,
        discount: it.discount || 0,
        tax: it.tax || 0,
        total,
      };
    });

    const total = subtotal - (dto.discount || 0) + (dto.tax || 0);

    const invoice = await this.repository.createInvoice({
      invoiceNumber,
      clientId: dto.clientId,
      projectId: dto.projectId,
      status: InvoiceStatus.DRAFT,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      subtotal,
      discount: dto.discount || 0,
      tax: dto.tax || 0,
      total,
      balanceDue: total,
      currencyId: dto.currencyId,
      items: {
        create: items,
      },
    });

    await this.repository.createInvoiceTimeline({
      invoiceId: invoice.id,
      event: 'Created',
      description: `Invoice ${invoiceNumber} created as Draft`,
    });

    this.logger.audit(context.userId, 'Create Invoice', 'invoice', invoice, {
      after: invoice,
    });
    return invoice;
  }

  // Invoice finalized -> Sent -> post AR & Revenue to Ledger
  async markAsSent(id: string, context: RequestContext) {
    const invoice = await this.repository.findInvoiceById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Invoice is already finalized/sent');
    }

    const updated = await this.repository.updateInvoice(id, {
      status: InvoiceStatus.SENT,
    });

    // Timeline
    await this.repository.createInvoiceTimeline({
      invoiceId: id,
      event: 'Sent',
      description: 'Invoice marked as Sent to client',
    });

    // Ledger posting: AR (debit) & Revenue (credit)
    const amount = Number(invoice.total);
    await this.accountingService.postJournalEntry(
      `Finalized invoice ${invoice.invoiceNumber}`,
      [{ accountCode: '1200', amount }], // Debit Accounts Receivable
      [{ accountCode: '4000', amount }], // Credit Revenue
    );

    this.logger.audit(
      context.userId,
      'Finalize Invoice (Sent)',
      'invoice',
      updated,
      { before: invoice, after: updated },
    );
    return updated;
  }

  // Generate Invoices from approved Time Entries
  async generateFromTimeEntries(
    dto: GenerateTimeEntryInvoiceDto,
    context: RequestContext,
  ) {
    const invoiceNumber = await this.getNextInvoiceNumber();

    // 1. Fetch and validate time entries
    const entries = await this.repository.prisma.timeEntry.findMany({
      where: {
        id: { in: dto.timeEntryIds },
        approved: true,
        billed: false,
      },
      include: { task: true },
    });

    if (entries.length === 0) {
      throw new BadRequestException(
        'No unbilled approved time entries selected',
      );
    }

    let subtotal = 0;
    const itemsData: any[] = [];

    // 2. Resolve rates and build invoice items
    for (const entry of entries) {
      const resolved = await this.ratesService.resolveEffectiveRate({
        taskId: entry.taskId || undefined,
        userId: entry.userId,
        projectId: entry.projectId || undefined,
        clientId: dto.clientId,
        targetCurrencyId: dto.currencyId,
      });

      const hours = entry.duration / 3600;
      const rate = resolved.rate || 50.0; // fallback default
      const total = hours * rate;
      subtotal += total;

      itemsData.push({
        type: InvoiceItemType.TIME_ENTRY,
        timeEntryId: entry.id,
        taskId: entry.taskId,
        description: `Time Entry: ${entry.description || 'Consulting'} (${hours.toFixed(2)} hours at ${resolved.currencyCode} ${rate.toFixed(2)}/hr)`,
        quantity: hours,
        rate,
        discount: 0.0,
        tax: 0.0,
        total,
      });
    }

    // 3. Create Invoice
    const invoice = await this.repository.createInvoice({
      invoiceNumber,
      clientId: dto.clientId,
      projectId: dto.projectId,
      status: InvoiceStatus.SENT, // Auto finalize to SENT
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Net 14
      subtotal,
      discount: 0.0,
      tax: 0.0,
      total: subtotal,
      balanceDue: subtotal,
      currencyId: dto.currencyId,
      items: {
        create: itemsData,
      },
    });

    // 4. Mark time entries as billed to prevent duplicates
    await this.repository.prisma.timeEntry.updateMany({
      where: { id: { in: dto.timeEntryIds } },
      data: { billed: true },
    });

    // 5. Post to Ledger immediately since status is SENT
    await this.accountingService.postJournalEntry(
      `Billed time entries via ${invoice.invoiceNumber}`,
      [{ accountCode: '1200', amount: subtotal }],
      [{ accountCode: '4000', amount: subtotal }],
    );

    await this.repository.createInvoiceTimeline({
      invoiceId: invoice.id,
      event: 'Created',
      description: `Invoice ${invoiceNumber} generated directly from approved TimeEntries`,
    });

    this.logger.audit(
      context.userId,
      'Generate Invoice from TimeEntries',
      'invoice',
      invoice,
      { after: invoice },
    );
    return invoice;
  }

  // Add payments (handles multi-invoice allocations)
  async allocatePayment(dto: AddPaymentDto, context: RequestContext) {
    // 1. Create root Payment entry
    const payment = await this.repository.createPayment({
      paymentDate: new Date(),
      paymentMethodId: dto.paymentMethodId,
      amount: dto.amount,
      transactionId: dto.transactionId || '',
      status: 'COMPLETED',
    });

    let totalAllocated = 0;

    // 2. Process allocations
    for (const alloc of dto.allocations) {
      const invoice = await this.repository.findInvoiceById(alloc.invoiceId);
      if (!invoice)
        throw new NotFoundException(
          `Invoice with ID ${alloc.invoiceId} not found`,
        );

      if (
        invoice.status === InvoiceStatus.DRAFT ||
        invoice.status === InvoiceStatus.PAID
      ) {
        throw new BadRequestException(
          `Cannot apply payment to invoice in status ${invoice.status}`,
        );
      }

      const balance = Number(invoice.balanceDue);
      const allocationAmt = Math.min(alloc.amountAllocated, balance);
      totalAllocated += allocationAmt;

      const newBalance = balance - allocationAmt;
      let status: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;
      if (newBalance <= 0.01) {
        status = InvoiceStatus.PAID;
      }

      // Save allocation
      await this.repository.createPaymentAllocation({
        paymentId: payment.id,
        invoiceId: invoice.id,
        amountAllocated: allocationAmt,
      });

      // Update Invoice balance and status
      await this.repository.updateInvoice(invoice.id, {
        balanceDue: newBalance,
        status,
      });

      // Timeline log
      await this.repository.createInvoiceTimeline({
        invoiceId: invoice.id,
        event: newBalance <= 0.01 ? 'Paid' : 'Partial Payment',
        description: `Payment allocation of ${allocationAmt} applied. Status updated to ${status}.`,
      });
    }

    // 3. Double-entry Journal Post
    // Debit Bank or Cash, Credit Accounts Receivable
    await this.accountingService.postJournalEntry(
      `Received client payment allocations via ${payment.transactionId || payment.id}`,
      [{ accountCode: '1020', amount: totalAllocated }], // Debit Bank Account
      [{ accountCode: '1200', amount: totalAllocated }], // Credit Accounts Receivable
    );

    this.logger.audit(context.userId, 'Allocate Payment', 'payment', payment, {
      after: payment,
    });
    return payment;
  }

  async getInvoiceById(id: string) {
    return this.repository.findInvoiceById(id);
  }

  async getInvoices(filters: {
    clientId?: string;
    projectId?: string;
    status?: InvoiceStatus;
  }) {
    return this.repository.findInvoices(filters);
  }

  async getCurrencies() {
    return this.repository.findCurrencies();
  }

  async getPaymentMethods() {
    return this.repository.prisma.paymentMethod.findMany();
  }

  async getTaxes() {
    return this.repository.findTaxes();
  }
}
