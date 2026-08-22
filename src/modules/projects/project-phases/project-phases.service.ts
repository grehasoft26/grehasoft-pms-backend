import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectPhasesRepository } from './project-phases.repository';
import {
  CreateProjectPhaseDto,
  UpdateProjectPhaseDto,
} from './dto/project-phases.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class ProjectPhasesService {
  constructor(
    private readonly repository: ProjectPhasesRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateProjectPhaseDto, context: RequestContext) {
    const phase = await this.repository.create({
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      createdBy: context.userId,
    });

    this.logger.audit(
      context.userId,
      'Create Project Phase',
      'projectPhase',
      phase,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: phase,
      },
    );

    return phase;
  }

  async getMany(projectId: string) {
    return this.repository.findMany(projectId);
  }

  async getById(id: string) {
    const phase = await this.repository.findById(id);
    if (!phase) {
      throw new NotFoundException(`Project phase with ID ${id} not found`);
    }
    return phase;
  }

  async update(
    id: string,
    dto: UpdateProjectPhaseDto,
    context: RequestContext,
  ) {
    const before = await this.getById(id);
    const updated = await this.repository.update(id, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      updatedBy: context.userId,
    });

    this.logger.audit(
      context.userId,
      'Update Project Phase',
      'projectPhase',
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

    this.logger.audit(
      context.userId,
      'Delete Project Phase',
      'projectPhase',
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
