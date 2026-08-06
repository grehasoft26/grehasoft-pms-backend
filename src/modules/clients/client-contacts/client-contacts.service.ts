import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientContactsRepository } from './client-contacts.repository';
import { ClientTimelinesRepository } from '../client-timelines/client-timelines.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateClientContactDto, UpdateClientContactDto } from './dto/client-contacts.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@Injectable()
export class ClientContactsService {
  constructor(
    private readonly repository: ClientContactsRepository,
    private readonly timelineRepository: ClientTimelinesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateClientContactDto, context: RequestContext) {
    if (dto.isPrimary) {
      await this.repository.clearPrimaryFlags(dto.clientId);
    }

    const contact = await this.repository.create({
      ...dto,
      createdBy: context.userId,
    });

    if (dto.isPrimary) {
      await this.repository.setClientPrimaryContact(dto.clientId, contact.id);
    }

    await this.timelineRepository.create({
      clientId: dto.clientId,
      event: 'CONTACT_ADDED',
      description: `Contact "${contact.name}" (${contact.designation || 'No Designation'}) was added.`,
      createdBy: context.userId,
      metadata: { contact },
    });

    this.logger.audit(context.userId, 'Create Client Contact', 'clientContact', contact, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: contact,
    });

    return contact;
  }

  async getMany(clientId?: string) {
    return this.repository.findMany(clientId);
  }

  async getById(id: string) {
    const contact = await this.repository.findById(id);
    if (!contact) throw new NotFoundException('Client contact not found');
    return contact;
  }

  async update(id: string, dto: UpdateClientContactDto, context: RequestContext) {
    const before = await this.getById(id);

    if (dto.isPrimary) {
      await this.repository.clearPrimaryFlags(before.clientId);
    }

    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    if (dto.isPrimary) {
      await this.repository.setClientPrimaryContact(before.clientId, updated.id);
    } else if (dto.isPrimary === false && before.isPrimary) {
      await this.repository.setClientPrimaryContact(before.clientId, null);
    }

    await this.timelineRepository.create({
      clientId: before.clientId,
      event: 'CONTACT_UPDATED',
      description: `Contact "${updated.name}" details were updated.`,
      createdBy: context.userId,
      metadata: { before, after: updated },
    });

    this.logger.audit(context.userId, 'Update Client Contact', 'clientContact', updated, {
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
      await this.repository.setClientPrimaryContact(before.clientId, null);
    }

    await this.timelineRepository.create({
      clientId: before.clientId,
      event: 'CONTACT_DELETED',
      description: `Contact "${before.name}" was deleted.`,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Delete Client Contact', 'clientContact', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }
}
