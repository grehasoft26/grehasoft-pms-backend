import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectTemplatesRepository } from './project-templates.repository';
import { CreateProjectTemplateDto, UpdateProjectTemplateDto } from './dto/project-templates.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class ProjectTemplatesService {
  constructor(
    private readonly repository: ProjectTemplatesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateProjectTemplateDto, context: RequestContext) {
    const template = await this.repository.create({
      ...dto,
      config: dto.config ? JSON.stringify(dto.config) : undefined,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Create Project Template', 'projectTemplate', template, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: template,
    });

    return this.parseTemplateConfig(template);
  }

  async getMany() {
    const templates = await this.repository.findMany();
    return templates.map((t) => this.parseTemplateConfig(t));
  }

  async getById(id: string) {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new NotFoundException(`Project template with ID ${id} not found`);
    }
    return this.parseTemplateConfig(template);
  }

  async update(id: string, dto: UpdateProjectTemplateDto, context: RequestContext) {
    const before = await this.getById(id);
    const updated = await this.repository.update(id, {
      ...dto,
      config: dto.config ? JSON.stringify(dto.config) : undefined,
      updatedBy: context.userId,
    });

    this.logger.audit(context.userId, 'Update Project Template', 'projectTemplate', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
      after: updated,
    });

    return this.parseTemplateConfig(updated);
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id, context.userId);

    this.logger.audit(context.userId, 'Delete Project Template', 'projectTemplate', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }

  private parseTemplateConfig(template: any) {
    if (template && typeof template.config === 'string') {
      try {
        template.config = JSON.parse(template.config);
      } catch (e) {
        template.config = null;
      }
    }
    return template;
  }
}
