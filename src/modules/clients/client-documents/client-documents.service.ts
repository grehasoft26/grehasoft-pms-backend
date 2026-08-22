import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientDocumentsRepository } from './client-documents.repository';
import { ClientTimelinesRepository } from '../client-timelines/client-timelines.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  CreateClientDocumentDto,
  UpdateClientDocumentDto,
} from './dto/client-documents.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { STORAGE_PROVIDER_TOKEN } from '../../../shared/storage/storage.interface';
import type { IStorageProvider } from '../../../shared/storage/storage.interface';

@Injectable()
export class ClientDocumentsService {
  constructor(
    private readonly repository: ClientDocumentsRepository,
    private readonly timelineRepository: ClientTimelinesRepository,
    private readonly logger: LoggerService,
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadDocument(
    dto: CreateClientDocumentDto,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number,
    context: RequestContext,
  ) {
    const fileKey = await this.storageProvider.uploadFile(
      fileBuffer,
      fileName,
      mimeType,
      `clients/${dto.clientId}`,
    );

    const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : undefined;
    const reminderDate = dto.reminderDate
      ? new Date(dto.reminderDate)
      : undefined;

    const doc = await this.repository.create({
      clientId: dto.clientId,
      fileName,
      fileKey,
      mimeType,
      fileSize,
      documentVersion: dto.documentVersion || '1.0',
      category: dto.category,
      expiryDate,
      reminderDate,
      uploadedBy: context.userId,
      createdBy: context.userId,
    });

    await this.timelineRepository.create({
      clientId: dto.clientId,
      event: 'DOCUMENT_UPLOADED',
      description: `Document "${fileName}" of category "${dto.category}" was uploaded.`,
      createdBy: context.userId,
      metadata: { document: doc },
    });

    this.logger.audit(
      context.userId,
      'Document Upload',
      'clientDocument',
      doc,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: doc,
      },
    );

    return doc;
  }

  async getMany(clientId?: string) {
    return this.repository.findMany(clientId);
  }

  async getById(id: string) {
    const doc = await this.repository.findById(id);
    if (!doc) throw new NotFoundException('Client document not found');
    return doc;
  }

  async getFileStream(id: string) {
    const doc = await this.getById(id);
    return this.storageProvider.getFileStream(doc.fileKey);
  }

  async update(
    id: string,
    dto: UpdateClientDocumentDto,
    context: RequestContext,
  ) {
    const before = await this.getById(id);

    const updateData: any = {
      ...dto,
      updatedBy: context.userId,
    };
    if (dto.expiryDate) updateData.expiryDate = new Date(dto.expiryDate);
    if (dto.reminderDate) updateData.reminderDate = new Date(dto.reminderDate);

    const updated = await this.repository.update(id, updateData);

    await this.timelineRepository.create({
      clientId: before.clientId,
      event: 'DOCUMENT_UPDATED',
      description: `Document "${updated.fileName}" details were updated.`,
      createdBy: context.userId,
      metadata: { before, after: updated },
    });

    this.logger.audit(
      context.userId,
      'Update Client Document',
      'clientDocument',
      updated,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before,
        after: updated,
      },
    );

    return updated;
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id, context.userId);

    try {
      await this.storageProvider.deleteFile(before.fileKey);
    } catch (err) {
      this.logger.error(
        `Failed to delete local document file: ${before.fileKey}`,
        err.stack,
        'ClientDocumentsService',
      );
    }

    await this.timelineRepository.create({
      clientId: before.clientId,
      event: 'DOCUMENT_DELETED',
      description: `Document "${before.fileName}" was deleted.`,
      createdBy: context.userId,
    });

    this.logger.audit(
      context.userId,
      'Delete Client Document',
      'clientDocument',
      { id },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before,
      },
    );
  }
}
