import { Injectable, NotFoundException } from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { CreateHostingPlanDto, CreateHostingAccountDto } from '../dto/hosting.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class HostingService {
  constructor(
    private readonly repository: InfrastructureRepository,
    private readonly logger: LoggerService
  ) {}

  async createPlan(dto: CreateHostingPlanDto, context: RequestContext) {
    const plan = await this.repository.createHostingPlan({
      providerId: dto.providerId,
      name: dto.name,
      diskGb: dto.diskGb,
      ramGb: dto.ramGb,
      cpuCores: dto.cpuCores,
      bandwidthGb: dto.bandwidthGb,
      priceMonthly: dto.priceMonthly || null,
    });

    this.logger.audit(context.userId, 'Create Hosting Plan', 'hostingPlan', plan, { after: plan });
    return plan;
  }

  async createAccount(dto: CreateHostingAccountDto, context: RequestContext) {
    const account = await this.repository.createHostingAccount({
      clientId: dto.clientId,
      projectId: dto.projectId,
      providerId: dto.providerId,
      accountUsername: dto.accountUsername,
      controlPanelUrl: dto.controlPanelUrl || '',
      hostingPlanId: dto.hostingPlanId || null,
      diskLimitGb: dto.diskLimitGb || null,
      diskUsedGb: 0.00,
      bandwidthLimitGb: dto.bandwidthLimitGb || null,
      bandwidthUsedGb: 0.00,
      notes: dto.notes || '',
    });

    this.logger.audit(context.userId, 'Create Hosting Account', 'hostingAccount', account, { after: account });
    return account;
  }

  async getPlans() {
    return this.repository.findHostingPlans();
  }

  async getAccounts(clientId?: string, projectId?: string) {
    return this.repository.findHostingAccounts({ clientId, projectId });
  }

  async getAccount(id: string) {
    const account = await this.repository.findHostingAccountById(id);
    if (!account) throw new NotFoundException('Hosting account not found');
    return account;
  }
}
