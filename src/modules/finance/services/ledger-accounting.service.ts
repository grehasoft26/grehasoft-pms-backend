import { Injectable, BadRequestException } from '@nestjs/common';
import { FinanceRepository } from '../repositories/finance.repository';

@Injectable()
export class LedgerAccountingService {
  constructor(private readonly repository: FinanceRepository) {}

  // Generate sequential journal entry numbering: JE-YYYY-000001
  private async getNextJournalEntryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastEntry = await this.repository.getLastJournalEntryNumber(year);
    let nextNum = 1;
    if (lastEntry && lastEntry.entryNumber) {
      const parts = lastEntry.entryNumber.split('-');
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }
    return `JE-${year}-${String(nextNum).padStart(6, '0')}`;
  }

  // Double entry journal posting
  async postJournalEntry(description: string, debits: { accountCode: string; amount: number }[], credits: { accountCode: string; amount: number }[]) {
    // 1. Verify totals match
    const totalDebit = debits.reduce((sum, d) => sum + d.amount, 0);
    const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`Debit and Credit amounts must balance (Debits: ${totalDebit}, Credits: ${totalCredit})`);
    }

    const entryNumber = await this.getNextJournalEntryNumber();

    // 2. Build lines and update ledger account balances
    const linesData: any[] = [];

    // Process Debits
    for (const d of debits) {
      const account = await this.repository.findLedgerAccountByCode(d.accountCode);
      if (!account) throw new BadRequestException(`Ledger account with code ${d.accountCode} not found`);
      
      let newBalance = Number(account.balance);
      if (account.type === 'ASSET' || account.type === 'EXPENSE') {
        newBalance += d.amount; // Debit increases Asset/Expense
      } else {
        newBalance -= d.amount; // Debit decreases liability/revenue/equity
      }
      await this.repository.updateLedgerAccountBalance(account.id, newBalance);

      linesData.push({
        accountId: account.id,
        debit: d.amount,
        credit: 0.00,
      });
    }

    // Process Credits
    for (const c of credits) {
      const account = await this.repository.findLedgerAccountByCode(c.accountCode);
      if (!account) throw new BadRequestException(`Ledger account with code ${c.accountCode} not found`);
      
      let newBalance = Number(account.balance);
      if (account.type === 'LIABILITY' || account.type === 'REVENUE' || account.type === 'EQUITY') {
        newBalance += c.amount; // Credit increases liability/revenue/equity
      } else {
        newBalance -= c.amount; // Credit decreases Asset/Expense
      }
      await this.repository.updateLedgerAccountBalance(account.id, newBalance);

      linesData.push({
        accountId: account.id,
        debit: 0.00,
        credit: c.amount,
      });
    }

    // Save Journal entry
    return this.repository.createJournalEntry({
      entryNumber,
      date: new Date(),
      description,
    }, linesData);
  }
}
