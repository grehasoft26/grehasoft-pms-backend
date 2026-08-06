import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReportsRepository } from './repositories/reports.repository';
import { CachingHelper } from './utils/caching.helper';
import { DashboardsService } from './dashboards/dashboards.service';
import { CrmReportsService } from './crm-reports/crm-reports.service';
import { ProjectReportsService } from './project-reports/project-reports.service';
import { FinanceReportsService } from './finance-reports/finance-reports.service';
import { HrReportsService } from './hr-reports/hr-reports.service';
import { InfrastructureReportsService } from './infrastructure-reports/infrastructure-reports.service';
import { ProductivityReportsService } from './productivity-reports/productivity-reports.service';
import { ExportsService } from './exports/exports.service';
import { KpisService } from './kpis/kpis.service';
import { AlertsService } from './alerts/alerts.service';
import { ReportsBuilderService } from './services/reports.service';

import { DashboardsController } from './controllers/dashboards.controller';
import { ReportsController } from './controllers/reports.controller';
import { ExportsController } from './controllers/exports.controller';
import { KpisController } from './controllers/kpis.controller';
import { AlertsController } from './controllers/alerts.controller';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    DashboardsController,
    ReportsController,
    ExportsController,
    KpisController,
    AlertsController,
  ],
  providers: [
    ReportsRepository,
    CachingHelper,
    DashboardsService,
    CrmReportsService,
    ProjectReportsService,
    FinanceReportsService,
    HrReportsService,
    InfrastructureReportsService,
    ProductivityReportsService,
    ExportsService,
    KpisService,
    AlertsService,
    ReportsBuilderService,
  ],
  exports: [
    ReportsRepository,
    CachingHelper,
    DashboardsService,
    CrmReportsService,
    ProjectReportsService,
    FinanceReportsService,
    HrReportsService,
    InfrastructureReportsService,
    ProductivityReportsService,
    ExportsService,
    KpisService,
    AlertsService,
    ReportsBuilderService,
  ],
})
export class ReportsModule {}
