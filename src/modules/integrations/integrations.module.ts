import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys/api-keys.service';
import { OAuthService } from './oauth/oauth.service';
import { SecretVaultService } from './secrets/secret-vault.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { IntegrationsService } from './integrations/integrations.service';
import { DeveloperPortalService } from './developer-apps/developer-portal.service';
import { RateLimiterService } from './rate-limits/rate-limiter.service';
import { AnalyticsService } from './api-analytics/analytics.service';
import { ApiVersionsService } from './api-versions/api-versions.service';

import { IntegrationsRepository } from './repositories/integrations.repository';
import { IntegrationsController } from './controllers/integrations.controller';
import { PrismaModule } from '../../core/database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsRepository,
    ApiKeysService,
    OAuthService,
    SecretVaultService,
    WebhooksService,
    IntegrationsService,
    DeveloperPortalService,
    RateLimiterService,
    AnalyticsService,
    ApiVersionsService,
  ],
  exports: [
    IntegrationsRepository,
    ApiKeysService,
    OAuthService,
    SecretVaultService,
    WebhooksService,
    IntegrationsService,
    DeveloperPortalService,
    RateLimiterService,
    AnalyticsService,
    ApiVersionsService,
  ],
})
export class IntegrationsModule {}
