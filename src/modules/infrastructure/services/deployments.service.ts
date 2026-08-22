import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import {
  CreateRepositoryDto,
  CreateRepositoryBranchDto,
  TriggerDeploymentDto,
  RollbackDeploymentDto,
} from '../dto/deployments.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { DeploymentStatus } from '@prisma/client';

@Injectable()
export class DeploymentsService {
  constructor(
    private readonly repository: InfrastructureRepository,
    private readonly logger: LoggerService,
  ) {}

  // Repository
  async createRepository(dto: CreateRepositoryDto, context: RequestContext) {
    const repo = await this.repository.createRepository({
      projectId: dto.projectId,
      name: dto.name,
      url: dto.url,
      owner: dto.owner || '',
      visibility: dto.visibility || 'PRIVATE',
      primaryLanguage: dto.primaryLanguage || 'TypeScript',
      defaultBranch: dto.defaultBranch || 'main',
      webhookEnabled: dto.webhookEnabled ?? false,
    });

    this.logger.audit(
      context.userId,
      'Create Git Repository',
      'repository',
      repo,
      { after: repo },
    );
    return repo;
  }

  async addBranch(
    repositoryId: string,
    dto: CreateRepositoryBranchDto,
    context: RequestContext,
  ) {
    const repo = await this.repository.findRepositoryById(repositoryId);
    if (!repo) throw new NotFoundException('Repository not found');

    const branch = await this.repository.addBranch({
      repositoryId,
      name: dto.name,
    });

    this.logger.audit(
      context.userId,
      'Add Repository Branch',
      'repositoryBranch',
      branch,
      { after: branch },
    );
    return branch;
  }

  async getRepositories(projectId?: string) {
    return this.repository.findRepositories(projectId);
  }

  // Trigger Deployment
  async triggerDeployment(dto: TriggerDeploymentDto, context: RequestContext) {
    const env = await this.repository.findServerEnvironmentById(
      dto.serverEnvironmentId,
    );
    if (!env) throw new NotFoundException('Server Environment not found');

    const deployment = await this.repository.createDeployment({
      projectId: dto.projectId,
      serverEnvironmentId: dto.serverEnvironmentId,
      repositoryBranchId: dto.repositoryBranchId || null,
      commitHash: dto.commitHash || 'HEAD',
      startedById: context.userId,
      status: DeploymentStatus.PENDING,
      rollbackSupport: dto.rollbackSupport ?? true,
      environmentVariableVersion: dto.environmentVariableVersion ?? 1,
      duration: null,
      buildLogs: '',
    });

    // Simulate running
    await this.repository.createDeploymentHistory({
      deploymentId: deployment.id,
      logMessage: 'Deployment pipeline initialized. Pulling code sources...',
      status: DeploymentStatus.RUNNING,
    });

    const updated = await this.repository.updateDeployment(deployment.id, {
      status: DeploymentStatus.SUCCESS,
      duration: dto.duration ?? 45, // default 45 seconds duration
      buildLogs:
        dto.buildLogs || 'Build Success. Assets Compiled. Nginx Reloaded.',
      finishedAt: new Date(),
    });

    await this.repository.createDeploymentHistory({
      deploymentId: deployment.id,
      logMessage: 'Build finished. Pipeline Success.',
      status: DeploymentStatus.SUCCESS,
    });

    this.logger.audit(
      context.userId,
      'Trigger Deployment Success',
      'deployment',
      updated,
      { after: updated },
    );
    return updated;
  }

  // Rollback Deployment
  async rollbackDeployment(
    deploymentId: string,
    dto: RollbackDeploymentDto,
    context: RequestContext,
  ) {
    const baseDep = await this.repository.findDeploymentById(deploymentId);
    if (!baseDep) throw new NotFoundException('Deployment not found');

    if (!baseDep.rollbackSupport) {
      throw new BadRequestException(
        'Rollback support is disabled for this deployment configuration',
      );
    }

    // Trigger a new deployment copy with ROLLBACK status
    const rollbackDep = await this.repository.createDeployment({
      projectId: baseDep.projectId,
      serverEnvironmentId: baseDep.serverEnvironmentId,
      repositoryBranchId: baseDep.repositoryBranchId,
      commitHash: baseDep.commitHash,
      startedById: context.userId,
      status: DeploymentStatus.ROLLBACK,
      rollbackSupport: false,
      duration: 15,
      rollbackReason: dto.rollbackReason,
      buildLogs: `Rollback triggered from deployment ${deploymentId}. Log: Code restored.`,
    });

    await this.repository.createDeploymentHistory({
      deploymentId: rollbackDep.id,
      logMessage: `Rollback started. Reason: ${dto.rollbackReason}`,
      status: DeploymentStatus.ROLLBACK,
    });

    this.logger.audit(
      context.userId,
      'Rollback Deployment Triggered',
      'deployment',
      rollbackDep,
      { after: rollbackDep },
    );
    return rollbackDep;
  }

  async getDeployments(projectId?: string) {
    return this.repository.findDeployments({ projectId });
  }

  async getDeployment(id: string) {
    const deployment = await this.repository.findDeploymentById(id);
    if (!deployment) throw new NotFoundException('Deployment record not found');
    return deployment;
  }
}
