import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsRepository } from '../repositories/integrations.repository';
import { CreateDeveloperAppDto } from '../dto/developer-apps.dto';
import * as crypto from 'crypto';

@Injectable()
export class DeveloperPortalService {
  constructor(private readonly repository: IntegrationsRepository) {}

  async createApplication(tenantId: string, userId: string, dto: CreateDeveloperAppDto) {
    const clientId = crypto.randomUUID();
    const clientSecret = crypto.randomBytes(32).toString('hex');

    const app = await this.repository.createDeveloperApp(tenantId, {
      userId,
      name: dto.name,
      description: dto.description || '',
      clientId,
      clientSecret,
      status: 'PENDING',
    });

    await this.repository.logAudit(tenantId, 'Create Developer App', `Developer application "${dto.name}" created.`);
    return app;
  }

  async getApplications(tenantId: string) {
    return this.repository.findDeveloperApps(tenantId);
  }

  async createTeam(tenantId: string, name: string, members: { email: string; role: string }[]) {
    const team = await this.repository.createDeveloperTeam(tenantId, name);
    for (const m of members) {
      await this.repository.addDeveloperMember(tenantId, team.id, m.email, m.role);
    }

    await this.repository.logAudit(tenantId, 'Create Developer Team', `Team "${name}" registered.`);
    return team;
  }

  async registerSDKPackage(tenantId: string, name: string, language: 'TYPESCRIPT' | 'PYTHON' | 'PHP', version: string, downloadUrl: string) {
    const sdk = await this.repository.createSDKPackage(tenantId, {
      name,
      language,
      versionString: version,
      downloadUrl,
    });

    await this.repository.logAudit(tenantId, 'Register SDK Package', `SDK package ${name} (${language}) version ${version} added.`);
    return sdk;
  }

  async getSDKPackages(tenantId: string) {
    return this.repository.findSDKPackages(tenantId);
  }
}
