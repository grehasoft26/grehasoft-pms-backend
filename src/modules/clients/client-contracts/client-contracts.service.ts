import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ClientContractsRepository } from './client-contracts.repository';
import { ClientTimelinesRepository } from '../client-timelines/client-timelines.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateClientContractDto, UpdateClientContractDto } from './dto/client-contracts.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@Injectable()
export class ClientContractsService {
  constructor(
    private readonly repository: ClientContractsRepository,
    private readonly timelineRepository: ClientTimelinesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateClientContractDto, context: RequestContext) {
    const exists = await this.repository.findByContractNumber(dto.contractNumber);
    if (exists) throw new ConflictException(`Contract with number "${dto.contractNumber}" already exists`);

    const contract = await this.repository.create({
      ...dto,
      createdBy: context.userId,
    });

    await this.timelineRepository.create({
      clientId: dto.clientId,
      event: 'CONTRACT_CREATED',
      description: `Contract "${contract.contractNumber}" was registered.`,
      createdBy: context.userId,
      metadata: { contract },
    });

    this.logger.audit(context.userId, 'Create Client Contract', 'clientContract', contract, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: contract,
    });

    return contract;
  }

  async getMany(clientId?: string) {
    return this.repository.findMany(clientId);
  }

  async getById(id: string) {
    const contract = await this.repository.findById(id);
    if (!contract) throw new NotFoundException('Client contract not found');
    return contract;
  }

  async update(id: string, dto: UpdateClientContractDto, context: RequestContext) {
    const before = await this.getById(id);

    if (dto.contractNumber && dto.contractNumber !== before.contractNumber) {
      const exists = await this.repository.findByContractNumber(dto.contractNumber);
      if (exists) throw new ConflictException(`Contract with number "${dto.contractNumber}" already exists`);
    }

    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    await this.timelineRepository.create({
      clientId: before.clientId,
      event: 'CONTRACT_UPDATED',
      description: `Contract "${updated.contractNumber}" details were updated.`,
      createdBy: context.userId,
      metadata: { before, after: updated },
    });

    this.logger.audit(context.userId, 'Contract Update', 'clientContract', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
      after: updated,
    });

    return updated;
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id, context.userId);

    await this.timelineRepository.create({
      clientId: before.clientId,
      event: 'CONTRACT_DELETED',
      description: `Contract "${before.contractNumber}" was deleted.`,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Delete Client Contract', 'clientContract', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }
}
