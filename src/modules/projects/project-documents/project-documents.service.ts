import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectDocumentsRepository } from './project-documents.repository';
import { CreateProjectDocumentDto } from './dto/project-documents.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { STORAGE_PROVIDER_TOKEN } from '../../../shared/storage/storage.interface';
import type { IStorageProvider } from '../../../shared/storage/storage.interface';

@Injectable()
export class ProjectDocumentsService {
  constructor(
    private readonly repository: ProjectDocumentsRepository,
    private readonly logger: LoggerService,
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storageProvider: IStorageProvider
  ) {}

  async create(dto: CreateProjectDocumentDto, context: RequestContext) {
    const doc = await this.repository.create({
      ...dto,
      uploadedBy: context.userId,
    });

    // Write timeline
    await this.repository.prisma.projectTimeline.create({
      data: {
        projectId: dto.projectId,
        event: 'DOCUMENT_UPLOADED',
        description: `Document "${dto.name}" (Category: ${dto.category}) was uploaded.`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(context.userId, 'Upload Project Document', 'projectDocument', doc, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: doc,
    });

    return doc;
  }

  async getMany(projectId: string) {
    return this.repository.findMany(projectId);
  }

  async getById(id: string) {
    const doc = await this.repository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Project document with ID ${id} not found`);
    }
    return doc;
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id, context.userId);

    // Write timeline
    await this.repository.prisma.projectTimeline.create({
      data: {
        projectId: before.projectId,
        event: 'DOCUMENT_DELETED',
        description: `Document "${before.name}" was deleted.`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(context.userId, 'Delete Project Document', 'projectDocument', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }

  async getFileStream(id: string) {
    const doc = await this.getById(id);
    return this.storageProvider.getFileStream(doc.fileKey);
  }
}
