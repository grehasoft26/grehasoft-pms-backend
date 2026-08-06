import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, InvoiceStatus, EstimateStatus, ExpenseStatus } from '@prisma/client';

@Injectable()
export class FinanceRepository {
  constructor(public readonly prisma: PrismaService) {}

  // Currencies
  async findCurrencies() {
    return this.prisma.currency.findMany();
  }

  async findCurrencyById(id: string) {
    return this.prisma.currency.findUnique({ where: { id } });
  }

  async findBaseCurrency() {
    return this.prisma.currency.findFirst({ where: { isBase: true } });
  }

  // Taxes
  async findTaxes() {
    return this.prisma.tax.findMany();
  }

  // Vendors
  async createVendor(data: Prisma.VendorUncheckedCreateInput) {
    return this.prisma.vendor.create({ data });
  }

  async updateVendor(id: string, data: Prisma.VendorUncheckedUpdateInput) {
    return this.prisma.vendor.update({ where: { id }, data });
  }

  async findVendors() {
    return this.prisma.vendor.findMany({ where: { status: 'ACTIVE' } });
  }

  async findVendorById(id: string) {
    return this.prisma.vendor.findUnique({ where: { id } });
  }

  // Expenses & Categories
  async createExpenseCategory(data: Prisma.ExpenseCategoryCreateInput) {
    return this.prisma.expenseCategory.create({ data });
  }

  async findExpenseCategories() {
    return this.prisma.expenseCategory.findMany();
  }

  async createExpense(data: Prisma.ExpenseUncheckedCreateInput) {
    return this.prisma.expense.create({
      data,
      include: { category: true, project: true, user: true, vendor: true, currency: true },
    });
  }

  async updateExpense(id: string, data: Prisma.ExpenseUncheckedUpdateInput) {
    return this.prisma.expense.update({
      where: { id },
      data,
      include: { category: true, project: true, user: true, vendor: true, currency: true },
    });
  }

  async findExpenses(filters: { projectId?: string; userId?: string; status?: ExpenseStatus }) {
    const where: Prisma.ExpenseWhereInput = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;

    return this.prisma.expense.findMany({
      where,
      include: { category: true, project: true, user: true, vendor: true, currency: true },
      orderBy: { date: 'desc' },
    });
  }

  async findExpenseById(id: string) {
    return this.prisma.expense.findUnique({
      where: { id },
      include: { category: true, project: true, user: true, vendor: true, currency: true },
    });
  }

  // Purchases
  async createPurchase(data: Prisma.PurchaseUncheckedCreateInput) {
    return this.prisma.purchase.create({
      data,
      include: { items: true, vendor: true, currency: true },
    });
  }

  async findPurchases() {
    return this.prisma.purchase.findMany({
      include: { vendor: true, currency: true },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async findPurchaseById(id: string) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: { items: true, vendor: true, currency: true },
    });
  }

  async getLastPurchaseNumber(year: number) {
    return this.prisma.purchase.findFirst({
      where: {
        purchaseNumber: {
          startsWith: `PO-${year}-`,
        },
      },
      orderBy: { purchaseNumber: 'desc' },
      select: { purchaseNumber: true },
    });
  }

  // Billable Rates
  async createBillableRate(data: Prisma.BillableRateUncheckedCreateInput) {
    return this.prisma.billableRate.create({ data });
  }

  async findBillableRates() {
    return this.prisma.billableRate.findMany({
      include: { client: true, project: true, task: true, user: true },
    });
  }

  // Resolve effective rate hierarchy Lookup Chain
  async findEffectiveRate(filters: {
    taskId?: string;
    userId?: string;
    projectId?: string;
    departmentId?: string;
    clientId?: string;
  }) {
    // 1. Task Rate
    if (filters.taskId) {
      const rate = await this.prisma.billableRate.findFirst({
        where: { taskId: filters.taskId },
        include: { currency: true },
      });
      if (rate) return rate;
    }
    // 2. Employee Rate
    if (filters.userId) {
      const rate = await this.prisma.billableRate.findFirst({
        where: { userId: filters.userId },
        include: { currency: true },
      });
      if (rate) return rate;
    }
    // 3. Project Rate
    if (filters.projectId) {
      const rate = await this.prisma.billableRate.findFirst({
        where: { projectId: filters.projectId },
        include: { currency: true },
      });
      if (rate) return rate;
    }
    // 4. Department Rate
    if (filters.departmentId) {
      const rate = await this.prisma.billableRate.findFirst({
        where: { departmentId: filters.departmentId },
        include: { currency: true },
      });
      if (rate) return rate;
    }
    // 5. Client Rate
    if (filters.clientId) {
      const rate = await this.prisma.billableRate.findFirst({
        where: { clientId: filters.clientId },
        include: { currency: true },
      });
      if (rate) return rate;
    }
    return null;
  }

  // Estimates (Quotations)
  async createEstimate(data: Prisma.EstimateUncheckedCreateInput) {
    return this.prisma.estimate.create({
      data,
      include: { items: true, client: true, currency: true },
    });
  }

  async updateEstimateStatus(id: string, status: EstimateStatus) {
    return this.prisma.estimate.update({
      where: { id },
      data: { status },
    });
  }

  async findEstimates() {
    return this.prisma.estimate.findMany({
      include: { client: true, currency: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findEstimateById(id: string) {
    return this.prisma.estimate.findUnique({
      where: { id },
      include: { items: true, client: true, currency: true },
    });
  }

  async getLastEstimateNumber(year: number) {
    return this.prisma.estimate.findFirst({
      where: {
        estimateNumber: {
          startsWith: `EST-${year}-`,
        },
      },
      orderBy: { estimateNumber: 'desc' },
      select: { estimateNumber: true },
    });
  }

  // Invoices
  async createInvoice(data: Prisma.InvoiceUncheckedCreateInput) {
    return this.prisma.invoice.create({
      data,
      include: { items: true, client: true, currency: true },
    });
  }

  async updateInvoice(id: string, data: Prisma.InvoiceUncheckedUpdateInput) {
    return this.prisma.invoice.update({
      where: { id },
      data,
      include: { items: true, client: true, currency: true },
    });
  }

  async findInvoices(filters: { clientId?: string; projectId?: string; status?: InvoiceStatus }) {
    const where: Prisma.InvoiceWhereInput = {};
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status;

    return this.prisma.invoice.findMany({
      where,
      include: { client: true, currency: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  async findInvoiceById(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        client: true,
        currency: true,
        timelines: { orderBy: { createdAt: 'asc' } },
        payments: { include: { payment: { include: { paymentMethod: true } } } },
        creditNotes: true,
        debitNotes: true,
      },
    });
  }

  async getLastInvoiceNumber(year: number) {
    return this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}-`,
        },
      },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
  }

  async createInvoiceTimeline(data: Prisma.InvoiceTimelineUncheckedCreateInput) {
    return this.prisma.invoiceTimeline.create({ data });
  }

  // Payments & Allocations
  async createPayment(data: Prisma.InvoicePaymentUncheckedCreateInput) {
    return this.prisma.invoicePayment.create({
      data,
      include: { paymentMethod: true },
    });
  }

  async createPaymentAllocation(data: Prisma.InvoicePaymentAllocationUncheckedCreateInput) {
    return this.prisma.invoicePaymentAllocation.create({ data });
  }

  async findPaymentById(id: string) {
    return this.prisma.invoicePayment.findUnique({
      where: { id },
      include: { allocations: { include: { invoice: true } }, paymentMethod: true },
    });
  }

  // Recurring Invoices
  async createRecurringInvoice(data: Prisma.RecurringInvoiceUncheckedCreateInput) {
    return this.prisma.recurringInvoice.create({
      data,
      include: { client: true, currency: true },
    });
  }

  async updateRecurringInvoice(id: string, data: Prisma.RecurringInvoiceUncheckedUpdateInput) {
    return this.prisma.recurringInvoice.update({
      where: { id },
      data,
    });
  }

  async findRecurringInvoices() {
    return this.prisma.recurringInvoice.findMany({
      include: { client: true, currency: true },
    });
  }

  async findRecurringInvoiceById(id: string) {
    return this.prisma.recurringInvoice.findUnique({
      where: { id },
      include: { client: true, currency: true },
    });
  }

  // Credit Notes & Debit Notes
  async createCreditNote(data: Prisma.CreditNoteUncheckedCreateInput) {
    return this.prisma.creditNote.create({ data });
  }

  async createDebitNote(data: Prisma.DebitNoteUncheckedCreateInput) {
    return this.prisma.debitNote.create({ data });
  }

  async getLastCreditNoteNumber(year: number) {
    return this.prisma.creditNote.findFirst({
      where: {
        noteNumber: {
          startsWith: `CN-${year}-`,
        },
      },
      orderBy: { noteNumber: 'desc' },
      select: { noteNumber: true },
    });
  }

  async getLastDebitNoteNumber(year: number) {
    return this.prisma.debitNote.findFirst({
      where: {
        noteNumber: {
          startsWith: `DN-${year}-`,
        },
      },
      orderBy: { noteNumber: 'desc' },
      select: { noteNumber: true },
    });
  }

  // Double Entry Ledger Accounting
  async findLedgerAccountByCode(code: string) {
    return this.prisma.ledgerAccount.findUnique({ where: { code } });
  }

  async updateLedgerAccountBalance(id: string, balance: number) {
    return this.prisma.ledgerAccount.update({
      where: { id },
      data: { balance },
    });
  }

  async createJournalEntry(data: Prisma.JournalEntryUncheckedCreateInput, lines: Prisma.JournalLineUncheckedCreateWithoutJournalEntryInput[]) {
    return this.prisma.journalEntry.create({
      data: {
        ...data,
        lines: {
          create: lines,
        },
      },
      include: {
        lines: { include: { account: true } },
      },
    });
  }

  async getLastJournalEntryNumber(year: number) {
    return this.prisma.journalEntry.findFirst({
      where: {
        entryNumber: {
          startsWith: `JE-${year}-`,
        },
      },
      orderBy: { entryNumber: 'desc' },
      select: { entryNumber: true },
    });
  }
}
