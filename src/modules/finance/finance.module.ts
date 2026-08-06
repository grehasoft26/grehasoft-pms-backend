import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanceRepository } from './repositories/finance.repository';
import { LedgerAccountingService } from './services/ledger-accounting.service';
import { BillableRatesService } from './services/billable-rates.service';
import { InvoicesService } from './services/invoices.service';
import { EstimatesService } from './services/estimates.service';
import { ExpensesService } from './services/expenses.service';
import { PurchasesService } from './services/purchases.service';
import { VendorsService } from './services/vendors.service';
import { FinancialDashboardService } from './services/dashboard.service';

import { InvoicesController } from './controllers/invoices.controller';
import { EstimatesController } from './controllers/estimates.controller';
import { ExpensesController } from './controllers/expenses.controller';
import { PurchasesController } from './controllers/purchases.controller';
import { VendorsController } from './controllers/vendors.controller';
import { RatesController } from './controllers/rates.controller';
import { FinancialDashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    InvoicesController,
    EstimatesController,
    ExpensesController,
    PurchasesController,
    VendorsController,
    RatesController,
    FinancialDashboardController,
  ],
  providers: [
    FinanceRepository,
    LedgerAccountingService,
    BillableRatesService,
    InvoicesService,
    EstimatesService,
    ExpensesService,
    PurchasesService,
    VendorsService,
    FinancialDashboardService,
  ],
  exports: [
    FinanceRepository,
    LedgerAccountingService,
    BillableRatesService,
    InvoicesService,
    EstimatesService,
    ExpensesService,
    PurchasesService,
    VendorsService,
    FinancialDashboardService,
  ],
})
export class FinanceModule {}
