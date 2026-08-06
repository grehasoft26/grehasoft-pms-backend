import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectCategoriesRepository } from './project-categories.repository';
import { CreateProjectCategoryDto, UpdateProjectCategoryDto } from './dto/project-categories.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class ProjectCategoriesService {
  constructor(
    private readonly repository: ProjectCategoriesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateProjectCategoryDto, context: RequestContext) {
    const category = await this.repository.create({
      ...dto,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Create Project Category', 'projectCategory', category, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: category,
    });

    return category;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Project category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateProjectCategoryDto, context: RequestContext) {
    const before = await this.getById(id);
    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    this.logger.audit(context.userId, 'Update Project Category', 'projectCategory', updated, {
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

    this.logger.audit(context.userId, 'Delete Project Category', 'projectCategory', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }
}
