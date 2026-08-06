import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientNotesRepository } from './client-notes.repository';
import { ClientTimelinesRepository } from '../client-timelines/client-timelines.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateClientNoteDto, UpdateClientNoteDto } from './dto/client-notes.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@Injectable()
export class ClientNotesService {
  constructor(
    private readonly repository: ClientNotesRepository,
    private readonly timelineRepository: ClientTimelinesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateClientNoteDto, context: RequestContext) {
    const note = await this.repository.create({
      ...dto,
      createdBy: context.userId,
    });

    await this.timelineRepository.create({
      clientId: dto.clientId,
      event: 'NOTE_ADDED',
      description: `A new client note titled "${note.title || 'Untitled'}" was added.`,
      createdBy: context.userId,
      metadata: { note },
    });

    this.logger.audit(context.userId, 'Create Client Note', 'clientNote', note, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: note,
    });

    return note;
  }

  async getMany(clientId?: string) {
    return this.repository.findMany(clientId);
  }

  async getById(id: string) {
    const note = await this.repository.findById(id);
    if (!note) throw new NotFoundException('Client note not found');
    return note;
  }

  async update(id: string, dto: UpdateClientNoteDto, context: RequestContext) {
    const before = await this.getById(id);
    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    await this.timelineRepository.create({
      clientId: before.clientId,
      event: 'NOTE_UPDATED',
      description: `Note titled "${updated.title || 'Untitled'}" details were updated.`,
      createdBy: context.userId,
      metadata: { before, after: updated },
    });

    this.logger.audit(context.userId, 'Update Client Note', 'clientNote', updated, {
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
      event: 'NOTE_DELETED',
      description: `Note titled "${before.title || 'Untitled'}" was deleted.`,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Delete Client Note', 'clientNote', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }
}
