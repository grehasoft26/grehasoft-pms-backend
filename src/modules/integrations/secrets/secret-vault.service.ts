import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsRepository } from '../repositories/integrations.repository';
import { SecretType } from '@prisma/client';
import { encryptPayload, decryptPayload } from '../utils/encryption.helper';

@Injectable()
export class SecretVaultService {
  constructor(private readonly repository: IntegrationsRepository) {}

  async storeSecret(tenantId: string, secretName: string, type: SecretType, plaintext: string) {
    const encryptedPayload = encryptPayload(plaintext);
    const secret = await this.repository.upsertSecret(tenantId, secretName, type, encryptedPayload);
    await this.repository.logAudit(tenantId, 'Store Vault Secret', `Secret "${secretName}" of type ${type} encrypted & stored in vault.`);
    return secret;
  }

  async getSecret(tenantId: string, secretName: string, type: SecretType): Promise<string> {
    const secret = await this.repository.findSecret(tenantId, secretName, type);
    if (!secret) throw new NotFoundException('Secret not found in vault');

    const decrypted = decryptPayload(secret.encryptedPayload);
    await this.repository.logAudit(tenantId, 'Access Vault Secret', `Secret "${secretName}" decrypted for access.`);
    return decrypted;
  }
}
