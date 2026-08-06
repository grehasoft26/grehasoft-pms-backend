import { Injectable } from '@nestjs/common';
import { FinanceRepository } from '../repositories/finance.repository';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class FinancialDashboardService {
  constructor(private readonly repository: FinanceRepository) {}

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Today's, Weekly, Monthly Revenue (from InvoicePayment)
    const todayPayments = await this.repository.prisma.invoicePayment.aggregate({
      where: {
        paymentDate: { gte: todayStart },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });
    const todayRevenue = Number(todayPayments._sum.amount || 0);

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyPayments = await this.repository.prisma.invoicePayment.aggregate({
      where: {
        paymentDate: { gte: startOfWeek },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });
    const weeklyRevenue = Number(weeklyPayments._sum.amount || 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = await this.repository.prisma.invoicePayment.aggregate({
      where: {
        paymentDate: { gte: startOfMonth },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });
    const monthlyRevenue = Number(monthlyPayments._sum.amount || 0);

    // 2. Outstanding & Overdue Invoices
    const outstandingSum = await this.repository.prisma.invoice.aggregate({
      where: {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
      },
      _sum: { balanceDue: true },
    });
    const outstanding = Number(outstandingSum._sum.balanceDue || 0);

    const overdueSum = await this.repository.prisma.invoice.aggregate({
      where: {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { lt: now },
      },
      _sum: { balanceDue: true },
    });
    const overdue = Number(overdueSum._sum.balanceDue || 0);

    // 3. Expenses
    const expensesSum = await this.repository.prisma.expense.aggregate({
      where: {
        status: 'PAID',
      },
      _sum: { amount: true },
    });
    const expenses = Number(expensesSum._sum.amount || 0);

    // 4. Receivables & Payables (from ledger accounts)
    const arAccount = await this.repository.findLedgerAccountByCode('1200');
    const apAccount = await this.repository.findLedgerAccountByCode('2100');
    const receivables = Number(arAccount?.balance || 0);
    const payables = Number(apAccount?.balance || 0);

    const profit = monthlyRevenue - expenses;

    return {
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      outstanding,
      overdue,
      expenses,
      profit,
      receivables,
      payables,
    };
  }

  async getProjectProfitability(projectId: string) {
    // 1. Total Invoiced on Project
    const invoices = await this.repository.prisma.invoice.aggregate({
      where: {
        projectId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID] },
      },
      _sum: { total: true },
    });
    const totalInvoiced = Number(invoices._sum.total || 0);

    // 2. Total Expenses logged on Project
    const expenses = await this.repository.prisma.expense.aggregate({
      where: {
        projectId,
        status: 'PAID',
      },
      _sum: { amount: true },
    });
    const totalExpenses = Number(expenses._sum.amount || 0);

    const profit = totalInvoiced - totalExpenses;
    const profitabilityRate = totalInvoiced > 0 ? Math.round((profit / totalInvoiced) * 100) : 0;

    return {
      projectId,
      totalInvoiced,
      totalExpenses,
      profit,
      profitabilityRate,
    };
  }
}
