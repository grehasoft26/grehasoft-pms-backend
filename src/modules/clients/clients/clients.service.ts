import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsRepository } from './clients.repository';
import { ClientTimelinesRepository } from '../client-timelines/client-timelines.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateClientDto, UpdateClientDto, ClientFilterDto } from './dto/clients.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { ClientStatus } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(
    private readonly repository: ClientsRepository,
    private readonly timelineRepository: ClientTimelinesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateClientDto, context: RequestContext) {
    const code = await this.repository.generateClientCode();
    const client = await this.repository.create({
      ...dto,
      code,
      createdBy: context.userId,
    });

    await this.timelineRepository.create({
      clientId: client.id,
      event: 'CLIENT_CREATED',
      description: `Client "${client.name}" was registered under code ${client.code}.`,
      createdBy: context.userId,
      metadata: { client },
    });

    this.logger.audit(context.userId, 'Create Client', 'client', client, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: client,
    });

    return client;
  }

  async getMany(filters: ClientFilterDto) {
    return this.repository.findMany(filters);
  }

  async getById(id: string) {
    const client = await this.repository.findById(id);
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, context: RequestContext) {
    const before = await this.getById(id);
    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    await this.timelineRepository.create({
      clientId: id,
      event: 'CLIENT_UPDATED',
      description: `Client details were updated.`,
      createdBy: context.userId,
      metadata: { before, after: updated },
    });

    this.logger.audit(context.userId, 'Update Client', 'client', updated, {
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
      clientId: id,
      event: 'CLIENT_DELETED',
      description: `Client was soft-deleted.`,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Delete Client', 'client', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }

  async restore(id: string, context: RequestContext) {
    const restored = await this.repository.restore(id);

    await this.timelineRepository.create({
      clientId: id,
      event: 'CLIENT_RESTORED',
      description: `Client was restored.`,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Restore Client', 'client', restored, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: restored,
    });

    return restored;
  }

  async setStatus(id: string, status: ClientStatus, context: RequestContext) {
    const before = await this.getById(id);
    const updated = await this.repository.update(id, {
      status,
      updatedBy: context.userId,
    });

    await this.timelineRepository.create({
      clientId: id,
      event: 'STATUS_CHANGED',
      description: `Client status changed from ${before.status} to ${status}.`,
      createdBy: context.userId,
      metadata: { oldStatus: before.status, newStatus: status },
    });

    this.logger.audit(context.userId, `Set Client Status: ${status}`, 'client', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
      after: updated,
    });

    return updated;
  }
}
