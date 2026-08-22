import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectMilestonesRepository } from './project-milestones.repository';
import {
  CreateProjectMilestoneDto,
  UpdateProjectMilestoneDto,
} from './dto/project-milestones.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { DependencyType, MilestoneStatus, ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectMilestonesService {
  constructor(
    private readonly repository: ProjectMilestonesRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateProjectMilestoneDto, context: RequestContext) {
    // 1. Create the milestone
    const dueDate = new Date(dto.dueDate);
    const milestone = await this.repository.create({
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      title: dto.title,
      description: dto.description,
      dueDate,
      completionPercentage: dto.completionPercentage || 0,
      status: dto.status,
      ownerId: dto.ownerId,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours || 0,
      createdBy: context.userId,
    });

    // 2. Add dependencies if provided
    if (dto.dependsOnMilestones && dto.dependsOnMilestones.length > 0) {
      for (const dependsOnId of dto.dependsOnMilestones) {
        // Prevent depending on self
        if (dependsOnId === milestone.id) {
          throw new BadRequestException('A milestone cannot depend on itself');
        }

        // Check for circular dependency
        const hasCycle = await this.checkCircularDependency(
          milestone.id,
          dependsOnId,
        );
        if (hasCycle) {
          // Cleanup created milestone and throw
          await this.repository.delete(milestone.id, context.userId);
          throw new BadRequestException(
            `Circular dependency detected: Milestone ${milestone.title} cannot depend on milestone ID ${dependsOnId}`,
          );
        }

        await this.repository.addDependency(
          milestone.id,
          dependsOnId,
          DependencyType.FS,
        );
      }
    }

    // 3. Log Audit
    this.logger.audit(
      context.userId,
      'Create Project Milestone',
      'projectMilestone',
      milestone,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: milestone,
      },
    );

    await this.recalculateProjectProgress(milestone.projectId);

    return this.getById(milestone.id);
  }

  async getMany(projectId: string) {
    return this.repository.findMany(projectId);
  }

  async getById(id: string) {
    const milestone = await this.repository.findById(id);
    if (!milestone) {
      throw new NotFoundException(`Project milestone with ID ${id} not found`);
    }
    return milestone;
  }

  async update(
    id: string,
    dto: UpdateProjectMilestoneDto,
    context: RequestContext,
  ) {
    const before = await this.getById(id);

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    let completionPercentage = dto.completionPercentage;
    if (dto.status === 'COMPLETED' && completionPercentage === undefined) {
      completionPercentage = 100;
    } else if (dto.status === 'PENDING' && completionPercentage === undefined) {
      completionPercentage = 0;
    }

    const updated = await this.repository.update(id, {
      phaseId: dto.phaseId,
      title: dto.title,
      description: dto.description,
      dueDate,
      completionPercentage,
      status: dto.status,
      ownerId: dto.ownerId,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
      updatedBy: context.userId,
    });

    // Handle dependencies updates if provided
    if (dto.dependsOnMilestones !== undefined) {
      await this.repository.clearDependencies(id);

      for (const dependsOnId of dto.dependsOnMilestones) {
        if (dependsOnId === id) {
          throw new BadRequestException('A milestone cannot depend on itself');
        }

        const hasCycle = await this.checkCircularDependency(id, dependsOnId);
        if (hasCycle) {
          // Rollback dependencies by putting back the old ones
          await this.repository.clearDependencies(id);
          const oldDeps = before.dependencies || [];
          for (const oldDep of oldDeps) {
            if (oldDep.dependsOnMilestoneId) {
              await this.repository.addDependency(
                id,
                oldDep.dependsOnMilestoneId,
                oldDep.type,
              );
            }
          }
          throw new BadRequestException(
            `Circular dependency detected: Milestone ${updated.title} cannot depend on milestone ID ${dependsOnId}`,
          );
        }

        await this.repository.addDependency(id, dependsOnId, DependencyType.FS);
      }
    }

    // Audit Log
    this.logger.audit(
      context.userId,
      'Update Project Milestone',
      'projectMilestone',
      updated,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before,
        after: updated,
      },
    );

    await this.recalculateProjectProgress(updated.projectId);

    return this.getById(id);
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id, context.userId);

    this.logger.audit(
      context.userId,
      'Delete Project Milestone',
      'projectMilestone',
      { id },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before,
      },
    );

    await this.recalculateProjectProgress(before.projectId);
  }

  // DFS Cycle Detection helper
  async checkCircularDependency(
    milestoneId: string,
    dependsOnMilestoneId: string,
  ): Promise<boolean> {
    const visited = new Set<string>();

    const check = async (currentId: string): Promise<boolean> => {
      if (currentId === milestoneId) return true;
      if (visited.has(currentId)) return false;
      visited.add(currentId);

      const deps = await this.repository.prisma.projectDependency.findMany({
        where: { milestoneId: currentId },
      });

      for (const dep of deps) {
        if (dep.dependsOnMilestoneId) {
          const hasCycle = await check(dep.dependsOnMilestoneId);
          if (hasCycle) return true;
        }
      }
      return false;
    };

    return check(dependsOnMilestoneId);
  }

  async recalculateProjectProgress(projectId: string) {
    const prisma = this.repository.prisma;

    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId, deletedAt: null },
    });

    let projectProgress = 0;
    if (milestones.length > 0) {
      const totalMilestoneProgress = milestones.reduce(
        (sum, m) => sum + (m.completionPercentage || 0),
        0,
      );
      projectProgress = Math.round(totalMilestoneProgress / milestones.length);
    }

    // Determine project status
    let projectStatus: ProjectStatus = ProjectStatus.PLANNING;
    const hasBlockedMilestones = milestones.some(
      (m) => m.status === MilestoneStatus.DELAYED,
    );
    if (hasBlockedMilestones) {
      projectStatus = ProjectStatus.ACTIVE;
    } else if (projectProgress === 0) {
      projectStatus = ProjectStatus.PLANNING;
    } else if (projectProgress < 100) {
      projectStatus = ProjectStatus.ACTIVE;
    } else if (projectProgress === 100) {
      projectStatus = ProjectStatus.COMPLETED;
    }

    // Read current status to avoid overriding manual override statuses like ARCHIVED or ON_HOLD
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });

    const updateData: { completionPercentage: number; status?: ProjectStatus } =
      {
        completionPercentage: projectProgress,
      };
    if (
      currentProject &&
      currentProject.status !== ProjectStatus.ARCHIVED &&
      currentProject.status !== ProjectStatus.ON_HOLD
    ) {
      updateData.status = projectStatus;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });
  }
}
