import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Req,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

import { ApiKeysService } from '../api-keys/api-keys.service';
import { OAuthService } from '../oauth/oauth.service';
import { SecretVaultService } from '../secrets/secret-vault.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { DeveloperPortalService } from '../developer-apps/developer-portal.service';
import { RateLimiterService } from '../rate-limits/rate-limiter.service';
import { AnalyticsService } from '../api-analytics/analytics.service';

import { CreateApiKeyDto } from '../dto/api-keys.dto';
import { CreateOAuthAppDto } from '../dto/oauth.dto';
import { CreateWebhookDto } from '../dto/webhooks.dto';
import { CreateDeveloperAppDto } from '../dto/developer-apps.dto';
import { IntegrationProvider, SecretType } from '@prisma/client';

@ApiTags('API Gateway & Integrations')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly oauthService: OAuthService,
    private readonly vaultService: SecretVaultService,
    private readonly webhooksService: WebhooksService,
    private readonly integrationsService: IntegrationsService,
    private readonly developerPortalService: DeveloperPortalService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  private getContext(req: Request) {
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000';
    const user = (req as any).user;
    const userId = user?.id || (req.headers['x-user-id'] as string) || 'system';
    return { tenantId, userId };
  }

  // API Keys Endpoints
  @Post('api-keys')
  @Permissions('apikeys.manage')
  @ApiOperation({ summary: 'Create a new developer API key' })
  @ApiResponse({ type: SuccessResponseDto })
  async createApiKey(@Body() dto: CreateApiKeyDto, @Req() req: Request) {
    const { tenantId, userId } = this.getContext(req);
    const data = await this.apiKeysService.create(tenantId, userId, dto);
    return { message: 'API Key created successfully', data };
  }

  @Post('api-keys/:id/rotate')
  @Permissions('apikeys.manage')
  @ApiOperation({ summary: 'Rotate an existing API key' })
  @ApiResponse({ type: SuccessResponseDto })
  async rotateApiKey(@Param('id') id: string, @Req() req: Request) {
    const { tenantId } = this.getContext(req);
    const data = await this.apiKeysService.rotate(tenantId, id);
    return { message: 'API Key rotated successfully', data };
  }

  @Delete('api-keys/:id')
  @Permissions('apikeys.manage')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ type: SuccessResponseDto })
  async revokeApiKey(@Param('id') id: string, @Req() req: Request) {
    const { tenantId } = this.getContext(req);
    const data = await this.apiKeysService.revoke(tenantId, id);
    return { message: 'API Key revoked successfully', data };
  }

  // OAuth Endpoints
  @Post('oauth/applications')
  @Permissions('oauth.manage')
  @ApiOperation({ summary: 'Register a new OAuth Application' })
  @ApiResponse({ type: SuccessResponseDto })
  async createOAuthApp(@Body() dto: CreateOAuthAppDto, @Req() req: Request) {
    const { tenantId, userId } = this.getContext(req);
    const data = await this.oauthService.createApplication(
      tenantId,
      userId,
      dto,
    );
    return { message: 'OAuth Application registered successfully', data };
  }

  @Post('oauth/token')
  @Permissions('oauth.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange authorization code for access and refresh tokens',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async generateOAuthToken(
    @Body()
    dto: {
      clientId: string;
      clientSecret: string;
      code: string;
      redirectUri: string;
      codeVerifier?: string;
    },
    @Req() req: Request,
  ) {
    const { tenantId } = this.getContext(req);
    const data = await this.oauthService.generateToken(
      tenantId,
      dto.clientId,
      dto.clientSecret,
      dto.code,
      dto.redirectUri,
      dto.codeVerifier,
    );
    return { message: 'OAuth Token exchanged successfully', data };
  }

  // Third-party Integrations Endpoints
  @Post('connect')
  @Permissions('integrations.manage')
  @ApiOperation({
    summary: 'Connect third-party service provider integration keys',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async connectProvider(
    @Body()
    dto: {
      provider: IntegrationProvider;
      clientId: string;
      credentials: Record<string, string>;
    },
    @Req() req: Request,
  ) {
    const { tenantId } = this.getContext(req);
    const data = await this.integrationsService.connectProvider(
      tenantId,
      dto.provider,
      dto.clientId,
      dto.credentials,
    );
    return { message: 'Provider connected successfully', data };
  }

  @Get('connected')
  @Permissions('integrations.manage')
  @ApiOperation({ summary: 'Get connected integrations list' })
  @ApiResponse({ type: SuccessResponseDto })
  async getConnectedIntegrations(@Req() req: Request) {
    const { tenantId } = this.getContext(req);
    const data =
      await this.integrationsService.getConnectedIntegrations(tenantId);
    return { message: 'Connected integrations retrieved', data };
  }

  // Webhooks Endpoints
  @Post('webhooks')
  @Permissions('webhooks.manage')
  @ApiOperation({ summary: 'Register a new custom webhook endpoint' })
  @ApiResponse({ type: SuccessResponseDto })
  async createWebhook(@Body() dto: CreateWebhookDto, @Req() req: Request) {
    const { tenantId, userId } = this.getContext(req);
    const data = await this.webhooksService.create(tenantId, userId, dto);
    return { message: 'Webhook endpoint registered successfully', data };
  }

  @Get('webhooks')
  @Permissions('webhooks.manage')
  @ApiOperation({ summary: 'Get list of custom webhook subscriptions' })
  @ApiResponse({ type: SuccessResponseDto })
  async getWebhooks(@Req() req: Request) {
    const { tenantId } = this.getContext(req);
    const data = await this.webhooksService.getWebhooks(tenantId);
    return { message: 'Webhook subscriptions retrieved', data };
  }

  // Secret Vault Endpoints
  @Post('vault')
  @Permissions('integrations.manage')
  @ApiOperation({ summary: 'Encrypt and store credential secret in vault' })
  @ApiResponse({ type: SuccessResponseDto })
  async storeSecret(
    @Body() dto: { name: string; type: SecretType; plaintext: string },
    @Req() req: Request,
  ) {
    const { tenantId } = this.getContext(req);
    const data = await this.vaultService.storeSecret(
      tenantId,
      dto.name,
      dto.type,
      dto.plaintext,
    );
    return { message: 'Secret stored securely in vault', data };
  }

  @Get('vault/:name')
  @Permissions('integrations.manage')
  @ApiOperation({ summary: 'Access decrypted credential secret from vault' })
  @ApiResponse({ type: SuccessResponseDto })
  async getSecret(
    @Param('name') name: string,
    @Query('type') type: SecretType,
    @Req() req: Request,
  ) {
    const { tenantId } = this.getContext(req);
    const data = await this.vaultService.getSecret(tenantId, name, type);
    return { message: 'Secret retrieved and decrypted', data };
  }

  // Developer Portal Endpoints
  @Post('developer/applications')
  @Permissions('developer.manage')
  @ApiOperation({ summary: 'Register new application on developer portal' })
  @ApiResponse({ type: SuccessResponseDto })
  async createDeveloperApp(
    @Body() dto: CreateDeveloperAppDto,
    @Req() req: Request,
  ) {
    const { tenantId, userId } = this.getContext(req);
    const data = await this.developerPortalService.createApplication(
      tenantId,
      userId,
      dto,
    );
    return { message: 'Developer application registered', data };
  }

  @Get('developer/applications')
  @Permissions('developer.manage')
  @ApiOperation({ summary: 'Get developer portal applications' })
  @ApiResponse({ type: SuccessResponseDto })
  async getDeveloperApps(@Req() req: Request) {
    const { tenantId } = this.getContext(req);
    const data = await this.developerPortalService.getApplications(tenantId);
    return { message: 'Developer applications retrieved', data };
  }

  // Gateways Rate Limiter and Analytics
  @Post('gateway/rate-limit')
  @Permissions('api.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate API Gateways Rate limiting sliding window check',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async checkRateLimit(
    @Body()
    dto: { identifier: string; limitCount?: number; windowSeconds?: number },
    @Req() req: Request,
  ) {
    const check = await this.rateLimiterService.enforceLimit(
      dto.identifier,
      dto.limitCount,
      dto.windowSeconds,
    );
    return { message: 'API Request rate limit check passed', data: check };
  }

  @Get('gateway/analytics')
  @Permissions('analytics.manage')
  @ApiOperation({
    summary: 'Get API Gateway aggregate analytics metrics dashboard',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getDashboardAnalytics(@Req() req: Request) {
    const { tenantId } = this.getContext(req);
    const data = await this.analyticsService.getDashboardAnalytics(tenantId);
    return { message: 'Gateway analytics metrics retrieved', data };
  }
}
