import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsRepository } from '../repositories/integrations.repository';
import { IntegrationProvider } from '@prisma/client';
import { SecretVaultService } from '../secrets/secret-vault.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly repository: IntegrationsRepository,
    private readonly vaultService: SecretVaultService
  ) {}

  async connectProvider(tenantId: string, provider: IntegrationProvider, clientId: string, credentials: Record<string, string>) {
    const integration = await this.repository.upsertIntegration(tenantId, provider, {
      clientId,
      status: 'CONNECTED',
    });

    for (const [key, val] of Object.entries(credentials)) {
      // Securely store credentials in vault
      const secretName = `integration_${integration.id}_${key}`;
      await this.vaultService.storeSecret(tenantId, secretName, 'API_KEY', val);

      // Save reference mapping in integrations
      await this.repository.upsertIntegrationCredential(tenantId, integration.id, key, secretName);
    }

    await this.repository.logAudit(tenantId, 'Connect Integration Provider', `Integration connected with ${provider}.`);
    return integration;
  }

  async getConnectedIntegrations(tenantId: string) {
    return this.repository.findIntegrations(tenantId);
  }
}
