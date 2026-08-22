import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InfrastructureRepository } from './repositories/infrastructure.repository';
import { DomainsService } from './services/domains.service';
import { SslService } from './services/ssl.service';
import { ServersService } from './services/servers.service';
import { HostingService } from './services/hosting.service';
import { DeploymentsService } from './services/deployments.service';
import { MonitoringService } from './services/monitoring.service';
import { BackupsService } from './services/backups.service';
import { IncidentsService } from './services/incidents.service';
import { InfrastructureDashboardService } from './services/dashboard.service';

import { DomainsController } from './controllers/domains.controller';
import { HostingController } from './controllers/hosting.controller';
import { ServersController } from './controllers/servers.controller';
import { DeploymentsController } from './controllers/deployments.controller';
import { SslController } from './controllers/ssl.controller';
import { BackupsController } from './controllers/backups.controller';
import { MonitoringController } from './controllers/monitoring.controller';
import { IncidentsController } from './controllers/incidents.controller';
import { InfrastructureDashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    DomainsController,
    HostingController,
    ServersController,
    DeploymentsController,
    SslController,
    BackupsController,
    MonitoringController,
    IncidentsController,
    InfrastructureDashboardController,
  ],
  providers: [
    InfrastructureRepository,
    DomainsService,
    SslService,
    ServersService,
    HostingService,
    DeploymentsService,
    MonitoringService,
    BackupsService,
    IncidentsService,
    InfrastructureDashboardService,
  ],
  exports: [
    InfrastructureRepository,
    DomainsService,
    SslService,
    ServersService,
    HostingService,
    DeploymentsService,
    MonitoringService,
    BackupsService,
    IncidentsService,
    InfrastructureDashboardService,
  ],
})
export class InfrastructureModule {}
