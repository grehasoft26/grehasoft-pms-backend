import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRisksRepository } from './project-risks.repository';
import { CreateProjectRiskDto, UpdateProjectRiskDto } from './dto/project-risks.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class ProjectRisksService {
  constructor(
    private readonly repository: ProjectRisksRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateProjectRiskDto, context: RequestContext) {
    const riskScore = dto.probability * dto.impact;

    const risk = await this.repository.create({
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description,
      probability: dto.probability,
      impact: dto.impact,
      riskScore,
      mitigationPlan: dto.mitigationPlan,
      ownerId: dto.ownerId,
      status: dto.status,
      createdBy: context.userId,
    });

    // Write timeline
    await this.repository.prisma.projectTimeline.create({
      data: {
        projectId: dto.projectId,
        event: 'RISK_ADDED',
        description: `Risk "${dto.title}" (Score: ${riskScore}) registered. mitigation plan updated.`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(context.userId, 'Create Project Risk', 'projectRisk', risk, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: risk,
    });

    return risk;
  }

  async getMany(projectId: string) {
    return this.repository.findMany(projectId);
  }

  async getById(id: string) {
    const risk = await this.repository.findById(id);
    if (!risk) {
      throw new NotFoundException(`Project risk with ID ${id} not found`);
    }
    return risk;
  }

  async update(id: string, dto: UpdateProjectRiskDto, context: RequestContext) {
    const before = await this.getById(id);

    const probability = dto.probability !== undefined ? dto.probability : before.probability;
    const impact = dto.impact !== undefined ? dto.impact : before.impact;
    const riskScore = probability * impact;

    const updated = await this.repository.update(id, {
      title: dto.title,
      description: dto.description,
      probability,
      impact,
      riskScore,
      mitigationPlan: dto.mitigationPlan,
      ownerId: dto.ownerId,
      status: dto.status,
      updatedBy: context.userId,
    });

    // Write timeline if status changed
    if (before.status !== updated.status) {
      await this.repository.prisma.projectTimeline.create({
        data: {
          projectId: updated.projectId,
          event: 'RISK_STATUS_CHANGED',
          description: `Risk "${updated.title}" status changed from ${before.status} to ${updated.status}.`,
          createdBy: context.userId,
        },
      });
    }

    // Audit
    this.logger.audit(context.userId, 'Update Project Risk', 'projectRisk', updated, {
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
        event: 'RISK_DELETED',
        description: `Risk "${before.title}" deleted from register.`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(context.userId, 'Delete Project Risk', 'projectRisk', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }
}
