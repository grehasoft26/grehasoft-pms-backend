import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule } from '../clients/clients.module';
import { StorageModule } from '../../shared/storage/storage.module';
import { PdfModule } from '../../shared/pdf/pdf.module';

import { LeadsController } from './leads/leads.controller';
import { LeadsService } from './leads/leads.service';
import { LeadsRepository } from './leads/leads.repository';

import { LeadSourcesController } from './lead-sources/lead-sources.controller';
import { LeadSourcesService } from './lead-sources/lead-sources.service';
import { LeadSourcesRepository } from './lead-sources/lead-sources.repository';

import { LeadStatusesController } from './lead-statuses/lead-statuses.controller';
import { LeadStatusesService } from './lead-statuses/lead-statuses.service';
import { LeadStatusesRepository } from './lead-statuses/lead-statuses.repository';

import { OpportunitiesController } from './opportunities/opportunities.controller';
import { OpportunitiesService } from './opportunities/opportunities.service';
import { OpportunitiesRepository } from './opportunities/opportunities.repository';

import { ProposalsController } from './proposals/proposals.controller';
import { ProposalsService } from './proposals/proposals.service';
import { ProposalsRepository } from './proposals/proposals.repository';

import { CrmDashboardController } from './crm-dashboard/crm-dashboard.controller';
import { CrmDashboardService } from './crm-dashboard/crm-dashboard.service';

@Module({
  imports: [
    AuthModule,
    ClientsModule,
    StorageModule,
    PdfModule,
  ],
  controllers: [
    LeadsController,
    LeadSourcesController,
    LeadStatusesController,
    OpportunitiesController,
    ProposalsController,
    CrmDashboardController,
  ],
  providers: [
    LeadsService,
    LeadsRepository,
    LeadSourcesService,
    LeadSourcesRepository,
    LeadStatusesService,
    LeadStatusesRepository,
    OpportunitiesService,
    OpportunitiesRepository,
    ProposalsService,
    ProposalsRepository,
    CrmDashboardService,
  ],
  exports: [
    LeadsService,
    LeadSourcesService,
    LeadStatusesService,
    OpportunitiesService,
    ProposalsService,
    CrmDashboardService,
  ],
})
export class CrmModule {}
