import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientAddressesRepository } from './client-addresses.repository';
import { ClientTimelinesRepository } from '../client-timelines/client-timelines.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateClientAddressDto, UpdateClientAddressDto } from './dto/client-addresses.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@Injectable()
export class ClientAddressesService {
  constructor(
    private readonly repository: ClientAddressesRepository,
    private readonly timelineRepository: ClientTimelinesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateClientAddressDto, context: RequestContext) {
    if (dto.isPrimary) {
      await this.repository.clearPrimaryFlags(dto.clientId);
    }

    const address = await this.repository.create({
      ...dto,
      createdBy: context.userId,
    });

    if (dto.isPrimary) {
      await this.repository.setClientPrimaryAddress(dto.clientId, address.id);
    }

    await this.timelineRepository.create({
      clientId: dto.clientId,
      event: 'ADDRESS_ADDED',
      description: `Address of type "${address.type}" was added.`,
      createdBy: context.userId,
      metadata: { address },
    });

    this.logger.audit(context.userId, 'Create Client Address', 'clientAddress', address, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: address,
    });

    return address;
  }

  async getMany(clientId?: string) {
    return this.repository.findMany(clientId);
  }

  async getById(id: string) {
    const address = await this.repository.findById(id);
    if (!address) throw new NotFoundException('Client address not found');
    return address;
  }

  async update(id: string, dto: UpdateClientAddressDto, context: RequestContext) {
    const before = await this.getById(id);

    if (dto.isPrimary) {
      await this.repository.clearPrimaryFlags(before.clientId);
    }

    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    if (dto.isPrimary) {
      await this.repository.setClientPrimaryAddress(before.clientId, updated.id);
    } else if (dto.isPrimary === false && before.isPrimary) {
      await this.repository.setClientPrimaryAddress(before.clientId, null);
    }

    await this.timelineRepository.create({
      clientId: before.clientId,
      event: 'ADDRESS_UPDATED',
      description: `Address of type "${updated.type}" details were updated.`,
      createdBy: context.userId,
      metadata: { before, after: updated },
    });

    this.logger.audit(context.userId, 'Update Client Address', 'clientAddress', updated, {
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

    if (before.isPrimary) {
      await this.repository.setClientPrimaryAddress(before.clientId, null);
    }

    await this.timelineRepository.create({
      clientId: before.clientId,
      event: 'ADDRESS_DELETED',
      description: `Address of type "${before.type}" was deleted.`,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Delete Client Address', 'clientAddress', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }
}
