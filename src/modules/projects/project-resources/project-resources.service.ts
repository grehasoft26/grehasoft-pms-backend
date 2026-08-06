import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectResourcesRepository } from './project-resources.repository';
import { CreateProjectResourceDto, UpdateProjectResourceDto } from './dto/project-resources.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class ProjectResourcesService {
  constructor(
    private readonly repository: ProjectResourcesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateProjectResourceDto, context: RequestContext) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const resource = await this.repository.create({
      projectId: dto.projectId,
      userId: dto.userId,
      allocationPercentage: dto.allocationPercentage,
      startDate,
      endDate,
      role: dto.role,
    });

    // Write project timeline
    await this.repository.prisma.projectTimeline.create({
      data: {
        projectId: dto.projectId,
        event: 'RESOURCE_ALLOCATED',
        description: `Employee "${resource.user.firstName} ${resource.user.lastName}" allocated at ${dto.allocationPercentage}% capacity for role "${dto.role}".`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(context.userId, 'Create Project Resource', 'projectResource', resource, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: resource,
    });

    return resource;
  }

  async getMany(projectId: string) {
    return this.repository.findMany(projectId);
  }

  async getById(id: string) {
    const resource = await this.repository.findById(id);
    if (!resource) {
      throw new NotFoundException(`Project resource with ID ${id} not found`);
    }
    return resource;
  }

  async update(id: string, dto: UpdateProjectResourceDto, context: RequestContext) {
    const before = await this.getById(id);
    
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const updated = await this.repository.update(id, {
      allocationPercentage: dto.allocationPercentage,
      startDate,
      endDate,
      role: dto.role,
    });

    // Audit
    this.logger.audit(context.userId, 'Update Project Resource', 'projectResource', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
      after: updated,
    });

    return updated;
  }

  async remove(id: string, context: RequestContext) {
    const resource = await this.getById(id);
    await this.repository.remove(id);

    // Write timeline
    await this.repository.prisma.projectTimeline.create({
      data: {
        projectId: resource.projectId,
        event: 'RESOURCE_DEALLOCATED',
        description: `Employee "${resource.user.firstName} ${resource.user.lastName}" deallocated from the project.`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(context.userId, 'Remove Project Resource', 'projectResource', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: resource,
    });
  }
}
