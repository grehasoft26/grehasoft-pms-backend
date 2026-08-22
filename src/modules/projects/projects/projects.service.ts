import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectFilterDto,
  CloneProjectDto,
} from './dto/projects.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  ProjectHealth,
  ProjectStatus,
  ProjectType,
  ProjectPriority,
} from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly repository: ProjectsRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateProjectDto, context: RequestContext) {
    const code = await this.repository.generateProjectCode();

    const estimatedCost = dto.estimatedCost;
    const actualCost = 0;
    const remainingBudget = estimatedCost;
    const budgetVariance = estimatedCost; // estimated - actual

    const project = await this.repository.create({
      code,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      priority: dto.priority,
      status: dto.status || ProjectStatus.PLANNING,
      healthStatus: ProjectHealth.GREEN,
      estimatedCost,
      actualCost,
      remainingBudget,
      budgetVariance,
      estimatedRevenue: dto.estimatedRevenue || 0,
      estimatedHours: dto.estimatedHours,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      completionPercentage: 0,
      colorLabel: dto.colorLabel,
      categoryId: dto.categoryId,
      clientId: dto.clientId,
      proposalId: dto.proposalId,
      managerId: dto.managerId,
      createdBy: context.userId,
    });

    if (dto.tags && dto.tags.length > 0) {
      await this.repository.syncTags(project.id, dto.tags);
    }

    // Write timeline
    await this.repository.createTimeline({
      projectId: project.id,
      event: 'PROJECT_CREATED',
      description: `Project "${project.name}" (${code}) was created.`,
      createdBy: context.userId,
    });

    // Audit
    this.logger.audit(context.userId, 'Create Project', 'project', project, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: project,
    });

    return this.getById(project.id);
  }

  async createFromProposal(
    proposalId: string,
    categoryId: string,
    managerId: string,
    context: RequestContext,
  ) {
    // 1. Fetch Proposal directly from DB
    const proposal = await this.repository.prisma.proposal.findUnique({
      where: { id: proposalId, deletedAt: null },
      include: { opportunity: true, items: true },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${proposalId} not found`);
    }

    if (proposal.isConverted) {
      throw new BadRequestException(
        'This proposal has already been converted to a project.',
      );
    }

    if (proposal.status !== 'ACCEPTED') {
      throw new BadRequestException(
        'Project can only be created from an ACCEPTED proposal',
      );
    }

    // 2. Map Proposal details to CreateProjectDto
    const code = await this.repository.generateProjectCode();
    const estimatedCost = Number(proposal.total);
    const actualCost = 0;
    const remainingBudget = estimatedCost;
    const budgetVariance = estimatedCost;

    // Estimate project duration (default 90 days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 90);

    const project = await this.repository.create({
      code,
      name: `Project: ${proposal.title}`,
      description: `Automatically created from Proposal ${proposal.proposalNumber}`,
      type: ProjectType.FIXED_PRICE,
      priority: ProjectPriority.MEDIUM,
      status: ProjectStatus.PLANNING,
      healthStatus: ProjectHealth.GREEN,
      estimatedCost,
      actualCost,
      remainingBudget,
      budgetVariance,
      estimatedRevenue: estimatedCost, // estimated revenue mapped to proposal value
      estimatedHours: 160, // default estimation
      startDate,
      endDate,
      completionPercentage: 0,
      categoryId,
      clientId: proposal.opportunity.clientId,
      proposalId: proposal.id,
      managerId,
      createdBy: context.userId,
    });

    // 3. Create default phases
    const defaultPhases = [
      { name: 'Planning & Requirements', code: 'PLANNING', sortOrder: 1 },
      { name: 'Design & Architecture', code: 'DESIGN', sortOrder: 2 },
      { name: 'Implementation & Dev', code: 'DEV', sortOrder: 3 },
      { name: 'Testing & Quality Assurance', code: 'QA', sortOrder: 4 },
      { name: 'Deployment & Signoff', code: 'DEPLOYMENT', sortOrder: 5 },
    ];

    for (const ph of defaultPhases) {
      await this.repository.prisma.projectPhase.create({
        data: {
          projectId: project.id,
          name: ph.name,
          code: ph.code,
          sortOrder: ph.sortOrder,
          createdBy: context.userId,
        },
      });
    }

    // 4. Update Proposal conversion status
    await this.repository.prisma.proposal.update({
      where: { id: proposalId },
      data: { isConverted: true },
    });

    // 5. Log conversion events
    await this.repository.createTimeline({
      projectId: project.id,
      event: 'PROPOSAL_CONVERTED_TO_PROJECT',
      description: `Project generated from Accepted Proposal "${proposal.proposalNumber}".`,
      createdBy: context.userId,
      metadata: { proposalId: proposal.id },
    });

    // Audit
    this.logger.audit(
      context.userId,
      'Convert Proposal to Project',
      'project',
      project,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: project,
      },
    );

    return this.getById(project.id);
  }

  async getMany(filters: ProjectFilterDto) {
    return this.repository.findMany(filters);
  }

  async getById(id: string) {
    const project = await this.repository.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, context: RequestContext) {
    const before = await this.getById(id);

    const estimatedCost =
      dto.estimatedCost !== undefined
        ? dto.estimatedCost
        : Number(before.estimatedCost);
    const actualCost =
      dto.actualCost !== undefined ? dto.actualCost : Number(before.actualCost);
    const remainingBudget = estimatedCost - actualCost;
    const budgetVariance = estimatedCost - actualCost;

    const completionPercentage =
      dto.completionPercentage !== undefined
        ? dto.completionPercentage
        : before.completionPercentage;

    // Calculate project health status dynamically
    const healthStatus = await this.calculateHealth(
      id,
      estimatedCost,
      actualCost,
      completionPercentage,
    );

    const updated = await this.repository.update(id, {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      priority: dto.priority,
      status: dto.status,
      healthStatus,
      estimatedCost,
      actualCost,
      remainingBudget,
      budgetVariance,
      estimatedRevenue: dto.estimatedRevenue,
      estimatedHours: dto.estimatedHours,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      actualStartDate: dto.actualStartDate
        ? new Date(dto.actualStartDate)
        : undefined,
      actualEndDate: dto.actualEndDate
        ? new Date(dto.actualEndDate)
        : undefined,
      completionPercentage,
      colorLabel: dto.colorLabel,
      categoryId: dto.categoryId,
      clientId: dto.clientId,
      proposalId: dto.proposalId,
      managerId: dto.managerId,
      updatedBy: context.userId,
    });

    if (dto.tags !== undefined) {
      await this.repository.syncTags(id, dto.tags);
    }

    // Write timeline logs on important updates
    if (before.status !== updated.status) {
      await this.repository.createTimeline({
        projectId: id,
        event: 'STATUS_CHANGED',
        description: `Project status changed from ${before.status} to ${updated.status}.`,
        createdBy: context.userId,
      });
    }

    if (before.estimatedCost.toString() !== updated.estimatedCost.toString()) {
      await this.repository.createTimeline({
        projectId: id,
        event: 'BUDGET_UPDATED',
        description: `Project budget estimated cost updated from ${before.estimatedCost} to ${updated.estimatedCost}.`,
        createdBy: context.userId,
      });
    }

    // Audit
    this.logger.audit(context.userId, 'Update Project', 'project', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
      after: updated,
    });

    return this.getById(id);
  }

  async archive(id: string, context: RequestContext) {
    const project = await this.getById(id);
    const updated = await this.repository.update(id, {
      status: ProjectStatus.ARCHIVED,
      updatedBy: context.userId,
    });

    await this.repository.createTimeline({
      projectId: id,
      event: 'PROJECT_ARCHIVED',
      description: `Project has been archived.`,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Archive Project', 'project', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: project,
      after: updated,
    });

    return updated;
  }

  async restore(id: string, context: RequestContext) {
    const project = await this.getById(id);
    const updated = await this.repository.update(id, {
      status: ProjectStatus.ACTIVE,
      updatedBy: context.userId,
    });

    await this.repository.createTimeline({
      projectId: id,
      event: 'PROJECT_RESTORED',
      description: `Project was restored from archive.`,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Restore Project', 'project', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: project,
      after: updated,
    });

    return updated;
  }

  async permanentDelete(id: string, context: RequestContext) {
    const before = await this.getById(id);

    // Clear relations that aren't set to cascade delete
    await this.repository.prisma.projectMember.deleteMany({
      where: { projectId: id },
    });
    await this.repository.prisma.projectResource.deleteMany({
      where: { projectId: id },
    });

    // Perform hard delete
    await this.repository.permanentDelete(id);

    this.logger.audit(
      context.userId,
      'Permanent Delete Project',
      'project',
      { id },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before,
      },
    );
  }

  async delete(id: string, userId: string) {
    const before = await this.getById(id);
    await this.repository.delete(id, userId);

    await this.repository.createTimeline({
      projectId: id,
      event: 'PROJECT_DELETED',
      description: `Project was soft-deleted.`,
      createdBy: userId,
    });

    this.logger.audit(
      userId,
      'Delete Project',
      'project',
      { id },
      {
        before,
      },
    );
  }

  async clone(id: string, dto: CloneProjectDto, context: RequestContext) {
    const source = await this.getById(id);

    // Calculate dates offset difference
    const newStartDate = new Date(dto.startDate);
    const oldStartDate = new Date(source.startDate);
    const dateDiffMs = newStartDate.getTime() - oldStartDate.getTime();

    // Create cloned project base
    const code = await this.repository.generateProjectCode();
    const project = await this.repository.create({
      code,
      name: dto.name,
      description: source.description,
      type: source.type,
      priority: source.priority,
      status: ProjectStatus.PLANNING,
      healthStatus: ProjectHealth.GREEN,
      estimatedCost: source.estimatedCost,
      actualCost: 0,
      remainingBudget: source.estimatedCost,
      budgetVariance: source.estimatedCost,
      estimatedRevenue: source.estimatedRevenue,
      estimatedHours: source.estimatedHours,
      startDate: newStartDate,
      endDate: new Date(new Date(source.endDate).getTime() + dateDiffMs),
      completionPercentage: 0,
      categoryId: source.categoryId,
      clientId: source.clientId,
      proposalId: source.proposalId,
      managerId: dto.managerId || source.managerId,
      createdBy: context.userId,
    });

    // 1. Clone Phases
    const phases = await this.repository.prisma.projectPhase.findMany({
      where: { projectId: id, deletedAt: null },
    });

    const phaseMap = new Map<string, string>(); // maps old phase id to new phase id
    for (const ph of phases) {
      const newPhase = await this.repository.prisma.projectPhase.create({
        data: {
          projectId: project.id,
          name: ph.name,
          code: ph.code,
          sortOrder: ph.sortOrder,
          startDate: ph.startDate
            ? new Date(new Date(ph.startDate).getTime() + dateDiffMs)
            : null,
          endDate: ph.endDate
            ? new Date(new Date(ph.endDate).getTime() + dateDiffMs)
            : null,
          createdBy: context.userId,
        },
      });
      phaseMap.set(ph.id, newPhase.id);
    }

    // 2. Clone Milestones
    if (dto.cloneMilestones !== false) {
      const milestones = await this.repository.prisma.projectMilestone.findMany(
        {
          where: { projectId: id, deletedAt: null },
        },
      );

      for (const ms of milestones) {
        const newPhaseId = ms.phaseId ? phaseMap.get(ms.phaseId) : null;
        await this.repository.prisma.projectMilestone.create({
          data: {
            projectId: project.id,
            phaseId: newPhaseId,
            title: ms.title,
            description: ms.description,
            dueDate: new Date(new Date(ms.dueDate).getTime() + dateDiffMs),
            completionPercentage: 0,
            status: 'PENDING',
            ownerId: ms.ownerId,
            estimatedHours: ms.estimatedHours,
            actualHours: 0,
            createdBy: context.userId,
          },
        });
      }
    }

    // 3. Clone Members
    if (dto.cloneMembers !== false) {
      const members = await this.repository.prisma.projectMember.findMany({
        where: { projectId: id },
      });

      for (const mb of members) {
        await this.repository.prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: mb.userId,
            role: mb.role,
          },
        });
      }
    }

    // 4. Clone Resources
    if (dto.cloneResources !== false) {
      const resources = await this.repository.prisma.projectResource.findMany({
        where: { projectId: id },
      });

      for (const res of resources) {
        await this.repository.prisma.projectResource.create({
          data: {
            projectId: project.id,
            userId: res.userId,
            allocationPercentage: res.allocationPercentage,
            startDate: new Date(new Date(res.startDate).getTime() + dateDiffMs),
            endDate: new Date(new Date(res.endDate).getTime() + dateDiffMs),
            role: res.role,
          },
        });
      }
    }

    // Write timeline
    await this.repository.createTimeline({
      projectId: project.id,
      event: 'PROJECT_CLONED',
      description: `Project cloned from source: "${source.name}" (${source.code})`,
      createdBy: context.userId,
    });

    // Audit
    this.logger.audit(context.userId, 'Clone Project', 'project', project, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: source,
      after: project,
    });

    return this.getById(project.id);
  }

  // Dynamic Health calculations (Refinement 2)
  private async calculateHealth(
    projectId: string,
    estimatedCost: number,
    actualCost: number,
    completionPercentage: number,
  ): Promise<ProjectHealth> {
    const now = new Date();

    // 1. Delayed Milestones (incomplete past due date)
    const delayedMilestonesCount =
      await this.repository.prisma.projectMilestone.count({
        where: {
          projectId,
          status: { not: 'COMPLETED' },
          dueDate: { lt: now },
          deletedAt: null,
        },
      });

    // 2. Budget Variance (actual cost exceeds estimates)
    const budgetVariance = estimatedCost - actualCost;

    // 3. Risks maximum score
    const maxRisk = await this.repository.prisma.projectRisk.aggregate({
      where: { projectId, deletedAt: null },
      _max: { riskScore: true },
    });
    const maxRiskScore = maxRisk._max.riskScore || 0;

    // 4. Open blocker issues
    const blockerIssuesCount = await this.repository.prisma.projectIssue.count({
      where: {
        projectId,
        status: { notIn: ['CLOSED', 'RESOLVED'] },
        type: 'BLOCKER',
        deletedAt: null,
      },
    });

    // Rules mapping health:
    // RED: negative budget variance OR any blocker issue OR risk score >= 16
    if (budgetVariance < 0 || blockerIssuesCount > 0 || maxRiskScore >= 16) {
      return ProjectHealth.RED;
    }
    // AMBER: delayed milestones OR risk score >= 9
    if (delayedMilestonesCount > 0 || maxRiskScore >= 9) {
      return ProjectHealth.AMBER;
    }
    // GREEN: otherwise
    return ProjectHealth.GREEN;
  }
}
