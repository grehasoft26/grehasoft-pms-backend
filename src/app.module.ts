import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import envConfig from './config/env.config';
import { validate } from './config/env.validation';

// Shared Modules
import { LoggerModule } from './shared/logger/logger.module';
import { CacheModule } from './shared/cache/cache.module';
import { QueueModule } from './shared/queue/queue.module';
import { MailModule } from './shared/mail/mail.module';
import { PdfModule } from './shared/pdf/pdf.module';
import { StorageModule } from './shared/storage/storage.module';
import { NotificationModule } from './shared/notifications/notification.module';

// Core Modules
import { PrismaModule } from './core/database/prisma.module';
import { SchedulerModule } from './core/scheduler/scheduler.module';
import { FeatureFlagsModule } from './core/feature-flags/feature-flags.module';
import { HealthModule } from './core/health/health.module';

import { SettingsModule } from './modules/settings/settings.module';
import { IamModule } from './modules/iam/iam.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CrmModule } from './modules/crm/crm.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TimeTrackingModule } from './modules/productivity/productivity.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { InfrastructureModule } from './modules/infrastructure/infrastructure.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SeoModule } from './modules/seo/seo.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';

// Middleware
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validate,
    }),

    // Global Core Database & Schedulers
    PrismaModule,
    SchedulerModule,
    FeatureFlagsModule,
    HealthModule,
    EventEmitterModule.forRoot(),

    // Global Shared Utilities
    LoggerModule,
    CacheModule,
    QueueModule,
    MailModule,
    PdfModule,
    StorageModule,
    NotificationModule,

    // Feature Modules
    SettingsModule,
    IamModule,
    AuthModule,
    ClientsModule,
    CrmModule,
    ProjectsModule,
    TasksModule,
    TimeTrackingModule,
    FinanceModule,
    HrModule,
    InfrastructureModule,
    ReportsModule,
    NotificationsModule,
    SeoModule,
    IntegrationsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*path');
  }
}
