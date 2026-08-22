import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  ApiKeyStatus,
  IntegrationProvider,
  WebhookStatus,
  OAuthStatus,
  IntegrationStatus,
  SDKLanguage,
  SecretType,
  DeveloperApplicationStatus,
} from '@prisma/client';

@Injectable()
export class IntegrationsRepository {
  private readonly logger = new Logger('INTEGRATIONS_REPO');

  constructor(public readonly prisma: PrismaService) {}

  private tenantWhere(tenantId: string, customWhere: any = {}) {
    return {
      tenantId,
      deletedAt: null,
      ...customWhere,
    };
  }

  // Audit Logs
  async logAudit(tenantId: string, action: string, details: string) {
    this.logger.log(`[Tenant: ${tenantId}] [Action: ${action}] - ${details}`);
    try {
      await this.prisma.notificationAudit.create({
        data: {
          tenantId,
          action,
          details,
        },
      });
    } catch (e) {
      this.logger.error('Failed to write to notification_audits:', e);
    }
  }

  // API Keys
  async createApiKey(tenantId: string, data: any) {
    return this.prisma.apiKey.create({
      data: { tenantId, ...data },
    });
  }

  async findApiKeyByHash(tenantId: string, keyHash: string) {
    return this.prisma.apiKey.findFirst({
      where: this.tenantWhere(tenantId, { keyHash }),
    });
  }

  async updateApiKey(tenantId: string, id: string, data: any) {
    return this.prisma.apiKey.updateMany({
      where: { tenantId, id },
      data,
    });
  }

  async logApiKeyUsage(tenantId: string, apiKeyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.apiKeyUsage.findFirst({
      where: { tenantId, apiKeyId, recordedAt: { gte: today } },
    });

    if (existing) {
      return this.prisma.apiKeyUsage.update({
        where: { id: existing.id },
        data: { requestCount: { increment: 1 } },
      });
    }

    return this.prisma.apiKeyUsage.create({
      data: {
        tenantId,
        apiKeyId,
        requestCount: 1,
        recordedAt: new Date(),
      },
    });
  }

  // OAuth
  async createOAuthApp(tenantId: string, data: any) {
    return this.prisma.oAuthApplication.create({
      data: { tenantId, ...data },
    });
  }

  async findOAuthAppByClientId(tenantId: string, clientId: string) {
    return this.prisma.oAuthApplication.findFirst({
      where: this.tenantWhere(tenantId, { clientId }),
    });
  }

  async createOAuthToken(tenantId: string, data: any) {
    return this.prisma.oAuthToken.create({
      data: { tenantId, ...data },
    });
  }

  async findOAuthToken(tenantId: string, accessToken: string) {
    return this.prisma.oAuthToken.findFirst({
      where: this.tenantWhere(tenantId, { accessToken }),
    });
  }

  async findOAuthTokenByRefresh(tenantId: string, refreshToken: string) {
    return this.prisma.oAuthToken.findFirst({
      where: this.tenantWhere(tenantId, { refreshToken }),
    });
  }

  // Integrations
  async upsertIntegration(
    tenantId: string,
    provider: IntegrationProvider,
    data: any,
  ) {
    const existing = await this.prisma.integration.findFirst({
      where: { tenantId, provider },
    });
    if (existing) {
      return this.prisma.integration.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.integration.create({
      data: { tenantId, provider, ...data },
    });
  }

  async findIntegrations(tenantId: string) {
    return this.prisma.integration.findMany({
      where: this.tenantWhere(tenantId),
      include: { credentials: true },
    });
  }

  async upsertIntegrationCredential(
    tenantId: string,
    integrationId: string,
    key: string,
    encryptedValue: string,
  ) {
    const existing = await this.prisma.integrationCredential.findFirst({
      where: { tenantId, integrationId, key },
    });
    if (existing) {
      return this.prisma.integrationCredential.update({
        where: { id: existing.id },
        data: { encryptedValue },
      });
    }
    return this.prisma.integrationCredential.create({
      data: { tenantId, integrationId, key, encryptedValue },
    });
  }

  // Webhooks
  async createWebhook(tenantId: string, data: any) {
    return this.prisma.webhook.create({
      data: { tenantId, ...data },
    });
  }

  async findWebhooks(tenantId: string) {
    return this.prisma.webhook.findMany({
      where: this.tenantWhere(tenantId),
    });
  }

  async findWebhookById(tenantId: string, id: string) {
    return this.prisma.webhook.findFirst({
      where: this.tenantWhere(tenantId, { id }),
    });
  }

  async logWebhookDelivery(tenantId: string, data: any) {
    return this.prisma.webhookDelivery.create({
      data: { tenantId, ...data },
    });
  }

  async logWebhookRetry(tenantId: string, data: any) {
    return this.prisma.webhookRetry.create({
      data: { tenantId, ...data },
    });
  }

  // Secret Vault
  async upsertSecret(
    tenantId: string,
    secretName: string,
    secretType: SecretType,
    encryptedPayload: string,
  ) {
    const existing = await this.prisma.secretVault.findFirst({
      where: { tenantId, secretName, secretType },
    });
    if (existing) {
      return this.prisma.secretVault.update({
        where: { id: existing.id },
        data: { encryptedPayload },
      });
    }
    return this.prisma.secretVault.create({
      data: { tenantId, secretName, secretType, encryptedPayload },
    });
  }

  async findSecret(
    tenantId: string,
    secretName: string,
    secretType: SecretType,
  ) {
    return this.prisma.secretVault.findFirst({
      where: this.tenantWhere(tenantId, { secretName, secretType }),
    });
  }

  // Developer Portal
  async createDeveloperApp(tenantId: string, data: any) {
    return this.prisma.developerApplication.create({
      data: { tenantId, ...data },
    });
  }

  async findDeveloperApps(tenantId: string) {
    return this.prisma.developerApplication.findMany({
      where: this.tenantWhere(tenantId),
    });
  }

  async createDeveloperTeam(tenantId: string, name: string) {
    return this.prisma.developerTeam.create({
      data: { tenantId, name },
    });
  }

  async addDeveloperMember(
    tenantId: string,
    teamId: string,
    email: string,
    role: string,
  ) {
    return this.prisma.developerMember.create({
      data: { tenantId, teamId, email, role },
    });
  }

  async createSDKPackage(tenantId: string, data: any) {
    return this.prisma.sDKPackage.create({
      data: { tenantId, ...data },
    });
  }

  async findSDKPackages(tenantId: string) {
    return this.prisma.sDKPackage.findMany({
      where: this.tenantWhere(tenantId),
    });
  }

  // Analytics
  async logApiAnalytics(
    tenantId: string,
    data: {
      endpointPath: string;
      method: string;
      latencyMs: number;
      isError: boolean;
    },
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.apiAnalytics.findFirst({
      where: {
        tenantId,
        endpointPath: data.endpointPath,
        method: data.method,
        recordedDate: today,
      },
    });

    if (existing) {
      const totalRequests = existing.totalRequests + 1;
      const errorRequests = existing.errorRequests + (data.isError ? 1 : 0);
      const avgLatencyMs = Math.round(
        (existing.avgLatencyMs * existing.totalRequests + data.latencyMs) /
          totalRequests,
      );

      return this.prisma.apiAnalytics.update({
        where: { id: existing.id },
        data: { totalRequests, errorRequests, avgLatencyMs },
      });
    }

    return this.prisma.apiAnalytics.create({
      data: {
        tenantId,
        endpointPath: data.endpointPath,
        method: data.method,
        totalRequests: 1,
        errorRequests: data.isError ? 1 : 0,
        avgLatencyMs: data.latencyMs,
        recordedDate: today,
      },
    });
  }

  async getAnalytics(tenantId: string) {
    return this.prisma.apiAnalytics.findMany({
      where: this.tenantWhere(tenantId),
    });
  }
}
