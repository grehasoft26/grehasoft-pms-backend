import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FinanceRepository } from '../repositories/finance.repository';
import { LedgerAccountingService } from './ledger-accounting.service';
import { CreateExpenseDto } from '../dto/expenses.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { ExpenseStatus } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly repository: FinanceRepository,
    private readonly accountingService: LedgerAccountingService,
    private readonly logger: LoggerService
  ) {}

  async createExpense(dto: CreateExpenseDto, context: RequestContext) {
    const expense = await this.repository.createExpense({
      categoryId: dto.categoryId,
      projectId: dto.projectId,
      userId: context.userId,
      vendorId: dto.vendorId,
      amount: dto.amount,
      currencyId: dto.currencyId,
      date: new Date(dto.date),
      description: dto.description || '',
      receiptPath: dto.receiptPath || '',
      status: ExpenseStatus.DRAFT,
    });

    this.logger.audit(context.userId, 'Create Expense', 'expense', expense, { after: expense });
    return expense;
  }

  // Multi-state approvals workflow validation
  async updateStatus(id: string, status: ExpenseStatus, context: RequestContext) {
    const expense = await this.repository.findExpenseById(id);
    if (!expense) throw new NotFoundException('Expense record not found');

    const currentStatus = expense.status;

    // Transition rule validations
    if (status === ExpenseStatus.SUBMITTED && currentStatus !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Expense must be in Draft state to submit');
    }
    if (status === ExpenseStatus.MANAGER_APPROVED && currentStatus !== ExpenseStatus.SUBMITTED) {
      throw new BadRequestException('Expense must be Submitted to get Manager approval');
    }
    if (status === ExpenseStatus.FINANCE_APPROVED && currentStatus !== ExpenseStatus.MANAGER_APPROVED) {
      throw new BadRequestException('Expense must have Manager approval to get Finance approval');
    }
    if (status === ExpenseStatus.PAID && currentStatus !== ExpenseStatus.FINANCE_APPROVED) {
      throw new BadRequestException('Expense must be approved by Finance to trigger payment');
    }

    const updated = await this.repository.updateExpense(id, { status });

    // Double entry accounting entry posting when paid
    if (status === ExpenseStatus.PAID) {
      const amount = Number(expense.amount);
      await this.accountingService.postJournalEntry(
        `Paid employee expense: ${expense.description || expense.id}`,
        [{ accountCode: '5000', amount }], // Debit Operating Expense
        [{ accountCode: '1020', amount }]  // Credit Bank Account
      );
    }

    this.logger.audit(context.userId, `Update Expense Status: ${status}`, 'expense', updated, { before: expense, after: updated });
    return updated;
  }

  async getExpenses(filters: { projectId?: string; userId?: string; status?: ExpenseStatus }) {
    return this.repository.findExpenses(filters);
  }

  async getExpenseById(id: string) {
    return this.repository.findExpenseById(id);
  }
}
