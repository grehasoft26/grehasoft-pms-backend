import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectIssuesRepository } from './project-issues.repository';
import { CreateProjectIssueDto, UpdateProjectIssueDto } from './dto/project-issues.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class ProjectIssuesService {
  constructor(
    private readonly repository: ProjectIssuesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateProjectIssueDto, context: RequestContext) {
    const issue = await this.repository.create({
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      priority: dto.priority,
      severity: dto.severity,
      status: dto.status,
      assignedToId: dto.assignedToId,
      resolution: dto.resolution,
      createdBy: context.userId,
    });

    // Write timeline
    await this.repository.prisma.projectTimeline.create({
      data: {
        projectId: dto.projectId,
        event: 'ISSUE_CREATED',
        description: `Issue "${dto.title}" (${dto.type} / Severity: ${dto.severity}) created.`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(context.userId, 'Create Project Issue', 'projectIssue', issue, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: issue,
    });

    return issue;
  }

  async getMany(projectId: string) {
    return this.repository.findMany(projectId);
  }

  async getById(id: string) {
    const issue = await this.repository.findById(id);
    if (!issue) {
      throw new NotFoundException(`Project issue with ID ${id} not found`);
    }
    return issue;
  }

  async update(id: string, dto: UpdateProjectIssueDto, context: RequestContext) {
    const before = await this.getById(id);
    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    // Write timeline if status changes
    if (before.status !== updated.status) {
      await this.repository.prisma.projectTimeline.create({
        data: {
          projectId: updated.projectId,
          event: 'ISSUE_STATUS_CHANGED',
          description: `Issue "${updated.title}" status updated from ${before.status} to ${updated.status}.`,
          createdBy: context.userId,
        },
      });
    }

    // Audit
    this.logger.audit(context.userId, 'Update Project Issue', 'projectIssue', updated, {
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

    // Write timeline
    await this.repository.prisma.projectTimeline.create({
      data: {
        projectId: before.projectId,
        event: 'ISSUE_DELETED',
        description: `Issue "${before.title}" deleted.`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(context.userId, 'Delete Project Issue', 'projectIssue', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }
}
