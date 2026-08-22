import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { RegisterDomainDto, CreateDnsRecordDto } from '../dto/domains.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { encryptSecret, decryptSecret } from '../utils/crypto.helper';

@Injectable()
export class DomainsService {
  constructor(
    private readonly repository: InfrastructureRepository,
    private readonly logger: LoggerService,
  ) {}

  async registerDomain(dto: RegisterDomainDto, context: RequestContext) {
    const existing = await this.repository.findDomainByName(dto.name);
    if (existing)
      throw new BadRequestException(
        `Domain name ${dto.name} is already registered`,
      );

    const domain = await this.repository.createDomain({
      clientId: dto.clientId,
      projectId: dto.projectId,
      name: dto.name,
      registrar: dto.registrar,
      purchaseDate: new Date(dto.purchaseDate),
      expiryDate: new Date(dto.expiryDate),
      autoRenew: dto.autoRenew ?? true,
      privacyProtection: dto.privacyProtection ?? false,
      registrarLock: dto.registrarLock ?? true,
      transferLock: dto.transferLock ?? true,
      purchaseCost: dto.purchaseCost ?? 0.0,
      renewalCost: dto.renewalCost ?? 0.0,
      renewalReminderDays: dto.renewalReminderDays ?? 30,
      nameservers: dto.nameservers || '',
      serverId: dto.serverId || null,
    });

    await this.repository.createTimelineEvent(
      domain.id,
      'Domain',
      'Domain Registered',
      `Domain ${dto.name} has been registered with ${dto.registrar}`,
    );

    this.logger.audit(context.userId, 'Register Domain', 'domain', domain, {
      after: domain,
    });
    return domain;
  }

  async updateDomain(id: string, dto: any, context: RequestContext) {
    const before = await this.getDomain(id);
    const domain = await this.repository.updateDomain(id, {
      clientId: dto.clientId,
      projectId: dto.projectId,
      name: dto.name,
      registrar: dto.registrar,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      autoRenew: dto.autoRenew,
      privacyProtection: dto.privacyProtection,
      registrarLock: dto.registrarLock,
      transferLock: dto.transferLock,
      purchaseCost: dto.purchaseCost,
      renewalCost: dto.renewalCost,
      renewalReminderDays: dto.renewalReminderDays,
      nameservers: dto.nameservers,
      serverId: dto.serverId || null,
    });

    await this.repository.createTimelineEvent(
      domain.id,
      'Domain',
      'Domain Updated',
      `Domain ${domain.name} details updated`,
    );

    this.logger.audit(context.userId, 'Update Domain', 'domain', domain, {
      before,
      after: domain,
    });
    return domain;
  }

  async deleteDomain(id: string, context: RequestContext) {
    const before = await this.getDomain(id);
    const domain = await this.repository.deleteDomain(id);
    this.logger.audit(context.userId, 'Delete Domain', 'domain', domain, {
      before,
    });
    return domain;
  }

  async addCredential(domainId: string, dto: any, context: RequestContext) {
    const domain = await this.getDomain(domainId);
    const passwordEncrypted = dto.password ? encryptSecret(dto.password) : null;
    const apiToken = dto.apiToken ? encryptSecret(dto.apiToken) : null;

    const credential = await this.repository.createCredential({
      domainId,
      credentialType: dto.credentialType,
      username: dto.username || '',
      passwordEncrypted,
      apiToken,
      rotationInterval: dto.rotationInterval || null,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
    });

    this.logger.audit(
      context.userId,
      'Add Domain Credential',
      'infrastructureCredential',
      credential,
      { after: credential },
    );
    return {
      id: credential.id,
      credentialType: credential.credentialType,
      message: 'Domain secret encrypted & saved successfully',
    };
  }

  async getCredentials(domainId: string) {
    const creds = await this.repository.findCredentials({ domainId });
    return creds.map((c) => ({
      id: c.id,
      credentialType: c.credentialType,
      username: c.username,
      password: c.passwordEncrypted ? decryptSecret(c.passwordEncrypted) : null,
      apiToken: c.apiToken ? decryptSecret(c.apiToken) : null,
      expiryDate: c.expiryDate,
    }));
  }

  async deleteCredential(credId: string, context: RequestContext) {
    const before = await this.repository.findCredentialById(credId);
    if (!before) throw new NotFoundException('Credential not found');
    const credential = await this.repository.deleteCredential(credId);
    this.logger.audit(
      context.userId,
      'Delete Domain Credential',
      'infrastructureCredential',
      credential,
      { before },
    );
    return credential;
  }

  async getDomain(id: string) {
    const domain = await this.repository.findDomainById(id);
    if (!domain) throw new NotFoundException('Domain not found');
    return domain;
  }

  async getDomains(clientId?: string) {
    return this.repository.findDomains({ clientId });
  }

  async addDnsRecord(
    domainId: string,
    dto: CreateDnsRecordDto,
    context: RequestContext,
  ) {
    const domain = await this.getDomain(domainId);
    const record = await this.repository.createDnsRecord({
      domainId,
      type: dto.type,
      host: dto.host,
      value: dto.value,
      ttl: dto.ttl ?? 3600,
      priority: dto.priority || null,
    });

    this.logger.audit(context.userId, 'Add DNS Record', 'dnsRecord', record, {
      after: record,
    });
    return record;
  }

  async deleteDnsRecord(id: string, context: RequestContext) {
    const record = await this.repository.deleteDnsRecord(id);
    this.logger.audit(
      context.userId,
      'Delete DNS Record',
      'dnsRecord',
      record,
      { before: record },
    );
    return record;
  }
}
