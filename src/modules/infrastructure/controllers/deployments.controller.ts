import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeploymentsService } from '../services/deployments.service';
import { CreateRepositoryDto, CreateRepositoryBranchDto, TriggerDeploymentDto, RollbackDeploymentDto } from '../dto/deployments.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('DevOps Deployments')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('infrastructure/deployments')
export class DeploymentsController {
  constructor(private readonly service: DeploymentsService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('repositories')
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Register a Git repository for client project (GitHub, GitLab, Bitbucket)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createRepository(@Body() dto: CreateRepositoryDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createRepository(dto, context);
    return { message: 'Git repository registered successfully', data };
  }

  @Get('repositories')
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get list of registered Git repositories' })
  @ApiResponse({ type: SuccessResponseDto })
  async getRepositories(@Query('projectId') projectId?: string) {
    const data = await this.service.getRepositories(projectId);
    return { message: 'Git repositories list retrieved', data };
  }

  @Post('repositories/:id/branches')
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Add branch to repository' })
  @ApiResponse({ type: SuccessResponseDto })
  async addBranch(
    @Param('id') repositoryId: string,
    @Body() dto: CreateRepositoryBranchDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.addBranch(repositoryId, dto, context);
    return { message: 'Branch registered successfully', data };
  }

  @Post('pipeline')
  @Permissions('deployments.manage')
  @ApiOperation({ summary: 'Trigger a new project environment deployment pipeline' })
  @ApiResponse({ type: SuccessResponseDto })
  async trigger(@Body() dto: TriggerDeploymentDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.triggerDeployment(dto, context);
    return { message: 'Deployment triggered successfully', data };
  }

  @Post('pipeline/:id/rollback')
  @Permissions('deployments.manage')
  @ApiOperation({ summary: 'Rollback environment to a previous deployment' })
  @ApiResponse({ type: SuccessResponseDto })
  async rollback(
    @Param('id') id: string,
    @Body() dto: RollbackDeploymentDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.rollbackDeployment(id, dto, context);
    return { message: 'Rollback initiated successfully', data };
  }

  @Get()
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get list of deployments' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId?: string) {
    const data = await this.service.getDeployments(projectId);
    return { message: 'Deployments list retrieved', data };
  }

  @Get(':id')
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get specific deployment details and histories build logs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getDeployment(id);
    return { message: 'Deployment details retrieved', data };
  }
}
