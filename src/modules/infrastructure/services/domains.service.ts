import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { RegisterDomainDto, CreateDnsRecordDto } from '../dto/domains.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class DomainsService {
  constructor(
    private readonly repository: InfrastructureRepository,
    private readonly logger: LoggerService
  ) {}

  async registerDomain(dto: RegisterDomainDto, context: RequestContext) {
    const existing = await this.repository.findDomainByName(dto.name);
    if (existing) throw new BadRequestException(`Domain name ${dto.name} is already registered`);

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
      purchaseCost: dto.purchaseCost ?? 0.00,
      renewalCost: dto.renewalCost ?? 0.00,
      renewalReminderDays: dto.renewalReminderDays ?? 30,
      nameservers: dto.nameservers || '',
    });

    await this.repository.createTimelineEvent(
      domain.id,
      'Domain',
      'Domain Registered',
      `Domain ${dto.name} has been registered with ${dto.registrar}`
    );

    this.logger.audit(context.userId, 'Register Domain', 'domain', domain, { after: domain });
    return domain;
  }

  async getDomain(id: string) {
    const domain = await this.repository.findDomainById(id);
    if (!domain) throw new NotFoundException('Domain not found');
    return domain;
  }

  async getDomains(clientId?: string) {
    return this.repository.findDomains({ clientId });
  }

  async addDnsRecord(domainId: string, dto: CreateDnsRecordDto, context: RequestContext) {
    const domain = await this.getDomain(domainId);
    const record = await this.repository.createDnsRecord({
      domainId,
      type: dto.type,
      host: dto.host,
      value: dto.value,
      ttl: dto.ttl ?? 3600,
      priority: dto.priority || null,
    });

    this.logger.audit(context.userId, 'Add DNS Record', 'dnsRecord', record, { after: record });
    return record;
  }

  async deleteDnsRecord(id: string, context: RequestContext) {
    const record = await this.repository.deleteDnsRecord(id);
    this.logger.audit(context.userId, 'Delete DNS Record', 'dnsRecord', record, { before: record });
    return record;
  }
}
