import { Injectable, NotFoundException } from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { CreateServerDto, CreateServerEnvironmentDto } from '../dto/servers.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { encryptSecret, decryptSecret } from '../utils/crypto.helper';

@Injectable()
export class ServersService {
  constructor(
    private readonly repository: InfrastructureRepository,
    private readonly logger: LoggerService
  ) {}

  async createServer(dto: CreateServerDto, context: RequestContext) {
    const server = await this.repository.createServer({
      name: dto.name,
      ipAddress: dto.ipAddress,
      sshPort: dto.sshPort ?? 22,
      os: dto.os,
      location: dto.location || '',
      providerId: dto.providerId,
      type: dto.type ?? 'VPS',
      status: dto.status ?? 'ACTIVE',
      diskGb: dto.diskGb || null,
      ramGb: dto.ramGb || null,
      cpuCores: dto.cpuCores || null,
      clientId: dto.clientId || null,
      projectId: dto.projectId || null,
    });

    await this.repository.createTimelineEvent(
      server.id,
      'Server',
      'Server Provisioned',
      `Server ${dto.name} (${dto.ipAddress}) provisioned successfully`
    );

    this.logger.audit(context.userId, 'Create Server', 'server', server, { after: server });
    return server;
  }

  async getServers(projectId?: string) {
    return this.repository.findServers({ projectId });
  }

  async getServer(id: string) {
    const server = await this.repository.findServerById(id);
    if (!server) throw new NotFoundException('Server not found');
    return server;
  }

  // Credentials Encryption
  async addCredential(serverId: string, dto: any, context: RequestContext) {
    const server = await this.getServer(serverId);
    const passwordEncrypted = dto.password ? encryptSecret(dto.password) : null;
    const sshPrivateKey = dto.sshPrivateKey ? encryptSecret(dto.sshPrivateKey) : null;
    const apiToken = dto.apiToken ? encryptSecret(dto.apiToken) : null;

    const credential = await this.repository.createCredential({
      serverId,
      credentialType: dto.credentialType,
      username: dto.username || '',
      passwordEncrypted,
      sshPrivateKey,
      apiToken,
      rotationInterval: dto.rotationInterval || null,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
    });

    this.logger.audit(context.userId, 'Add Server Credential', 'infrastructureCredential', credential, { after: credential });
    return { id: credential.id, credentialType: credential.credentialType, message: 'Secrets encrypted & saved successfully' };
  }

  async getCredentials(serverId: string) {
    const creds = await this.repository.findCredentials({ serverId });
    return creds.map((c) => ({
      id: c.id,
      credentialType: c.credentialType,
      username: c.username,
      password: c.passwordEncrypted ? decryptSecret(c.passwordEncrypted) : null,
      sshPrivateKey: c.sshPrivateKey ? decryptSecret(c.sshPrivateKey) : null,
      apiToken: c.apiToken ? decryptSecret(c.apiToken) : null,
      expiryDate: c.expiryDate,
    }));
  }

  // Server Environments
  async createServerEnvironment(dto: CreateServerEnvironmentDto, context: RequestContext) {
    const env = await this.repository.createServerEnvironment({
      serverId: dto.serverId,
      projectId: dto.projectId,
      environment: dto.environment,
      name: dto.name,
      domainName: dto.domainName || '',
    });

    this.logger.audit(context.userId, 'Create Server Environment', 'serverEnvironment', env, { after: env });
    return env;
  }

  async getEnvironments(serverId: string) {
    return this.repository.findServerEnvironments(serverId);
  }
}
