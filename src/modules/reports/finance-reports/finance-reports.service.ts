import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { executeQuery } from '../utils/query-engine.helper';

@Injectable()
export class FinanceReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueAndExpenses(tenantId: string, filters: any) {
    const invoices = await executeQuery(this.prisma, 'invoice', {
      tenantId,
      filters,
    });

    const expenses = await executeQuery(this.prisma, 'expense', {
      tenantId,
      filters,
    });

    let totalRevenue = 0;
    let totalOutstanding = 0;

    for (const inv of invoices) {
      if (inv.status === 'PAID') {
        totalRevenue += Number(inv.totalAmount || 0);
      } else {
        totalOutstanding += Number(inv.totalAmount || 0);
      }
    }

    const totalExpenses = expenses.reduce((sum, curr) => {
      // approved/paid expenses
      if (
        curr.status === 'PAID' ||
        curr.status === 'FINANCE_APPROVED' ||
        curr.status === 'APPROVED'
      ) {
        return sum + Number(curr.amount || 0);
      }
      return sum;
    }, 0);

    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalOutstanding,
      netProfit,
      profitMarginPercentage: Math.round(margin * 100) / 100,
    };
  }

  async getCashFlow(tenantId: string, filters: any) {
    // Aggregates payments received vs expenses paid
    const payments = await executeQuery(this.prisma, 'invoicePayment', {
      tenantId,
      filters,
    });

    const expenses = await executeQuery(this.prisma, 'expense', {
      tenantId,
      filters: { ...filters, status: 'PAID' },
    });

    const cashIn = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const cashOut = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      cashInflow: cashIn,
      cashOutflow: cashOut,
      netCashFlow: cashIn - cashOut,
    };
  }
}
