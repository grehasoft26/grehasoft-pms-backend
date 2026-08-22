import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsRepository } from '../repositories/integrations.repository';
import {
  resolveApiVersion,
  getVersionStatus,
} from '../utils/api-version.helper';

@Injectable()
export class ApiVersionsService {
  constructor(private readonly repository: IntegrationsRepository) {}

  async checkVersionStatus(tenantId: string, versionString: string) {
    const record = await this.repository.prisma.apiVersion.findUnique({
      where: { versionString },
    });
    if (!record) throw new NotFoundException('API Version not registered');
    return record.status;
  }

  async resolveAndValidate(
    tenantId: string,
    acceptHeader?: string,
    urlPath?: string,
  ): Promise<{ version: string; status: string }> {
    const version = resolveApiVersion(acceptHeader, urlPath);
    const record = await this.repository.prisma.apiVersion.findUnique({
      where: { versionString: version },
    });

    return {
      version,
      status: record ? record.status : 'UNKNOWN',
    };
  }
}
