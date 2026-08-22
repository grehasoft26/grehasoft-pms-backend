import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IntegrationsRepository } from '../repositories/integrations.repository';
import { CreateApiKeyDto } from '../dto/api-keys.dto';
import { generateRawApiKey, hashApiKey } from '../utils/api-key.helper';

@Injectable()
export class ApiKeysService {
  constructor(private readonly repository: IntegrationsRepository) {}

  async create(tenantId: string, userId: string, dto: CreateApiKeyDto) {
    const { rawKey, prefix, keyHash } = generateRawApiKey();
    const expiresAtDate = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const apiKey = await this.repository.createApiKey(tenantId, {
      userId,
      keyHash,
      prefix,
      name: dto.name,
      scopes: dto.scopes,
      status: 'ACTIVE',
      expiresAt: expiresAtDate,
    });

    await this.repository.logAudit(
      tenantId,
      'Create API Key',
      `API Key "${dto.name}" created for user ${userId}.`,
    );

    // Return rawKey to the user only ONCE upon creation!
    return {
      id: apiKey.id,
      name: apiKey.name,
      rawKey,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
    };
  }

  async validateKey(tenantId: string, rawKey: string): Promise<any> {
    const hash = hashApiKey(rawKey);
    const keyRecord = await this.repository.findApiKeyByHash(tenantId, hash);

    if (!keyRecord) return null;
    if (keyRecord.status !== 'ACTIVE') return null;

    if (keyRecord.expiresAt && keyRecord.expiresAt.getTime() < Date.now()) {
      await this.repository.updateApiKey(tenantId, keyRecord.id, {
        status: 'EXPIRED',
      });
      return null;
    }

    // Update usage stats
    await this.repository.updateApiKey(tenantId, keyRecord.id, {
      lastUsedAt: new Date(),
    });
    await this.repository.logApiKeyUsage(tenantId, keyRecord.id);

    return keyRecord;
  }

  async rotate(tenantId: string, id: string) {
    const existing = await this.repository.prisma.apiKey.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('API Key not found');

    const { rawKey, prefix, keyHash } = generateRawApiKey();
    await this.repository.updateApiKey(tenantId, id, {
      keyHash,
      prefix,
      status: 'ACTIVE',
      lastUsedAt: null,
    });

    await this.repository.logAudit(
      tenantId,
      'Rotate API Key',
      `API Key rotated.`,
    );
    return { rawKey };
  }

  async revoke(tenantId: string, id: string) {
    await this.repository.updateApiKey(tenantId, id, { status: 'REVOKED' });
    await this.repository.logAudit(
      tenantId,
      'Revoke API Key',
      `API Key revoked.`,
    );
    return { message: 'API Key revoked successfully' };
  }
}
