import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientCategoriesRepository } from './client-categories.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  CreateClientCategoryDto,
  UpdateClientCategoryDto,
} from './dto/client-categories.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@Injectable()
export class ClientCategoriesService {
  constructor(
    private readonly repository: ClientCategoriesRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateClientCategoryDto, context: RequestContext) {
    const exists = await this.repository.findByCode(dto.code);
    if (exists)
      throw new ConflictException(
        `Category with code "${dto.code}" already exists`,
      );

    const category = await this.repository.create({
      ...dto,
      createdBy: context.userId,
    });

    this.logger.audit(
      context.userId,
      'Create Client Category',
      'clientCategory',
      category,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: category,
      },
    );

    return category;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const category = await this.repository.findById(id);
    if (!category) throw new NotFoundException('Client category not found');
    return category;
  }

  async update(
    id: string,
    dto: UpdateClientCategoryDto,
    context: RequestContext,
  ) {
    const before = await this.getById(id);
    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    this.logger.audit(
      context.userId,
      'Update Client Category',
      'clientCategory',
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
    if (before.isSystem)
      throw new ConflictException('System categories cannot be deleted');

    await this.repository.delete(id, context.userId);

    this.logger.audit(
      context.userId,
      'Delete Client Category',
      'clientCategory',
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
