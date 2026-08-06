import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectIssuesService } from './project-issues.service';
import { CreateProjectIssueDto, UpdateProjectIssueDto } from './dto/project-issues.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Issues')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-issues')
export class ProjectIssuesController {
  constructor(private readonly issuesService: ProjectIssuesService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @Permissions('project-issues.create')
  @ApiOperation({ summary: 'Create issue ticket' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProjectIssueDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.issuesService.create(dto, context);
    return { message: 'Issue created successfully', data };
  }

  @Get()
  @Permissions('project-issues.read')
  @ApiOperation({ summary: 'List project issue tickets' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId: string) {
    const data = await this.issuesService.getMany(projectId);
    return { message: 'Issues retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('project-issues.read')
  @ApiOperation({ summary: 'Get specific issue ticket details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.issuesService.getById(id);
    return { message: 'Issue retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('project-issues.update')
  @ApiOperation({ summary: 'Update project issue details or resolution' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectIssueDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.issuesService.update(id, dto, context);
    return { message: 'Issue updated successfully', data };
  }

  @Delete(':id')
  @Permissions('project-issues.delete')
  @ApiOperation({ summary: 'Soft delete project issue ticket' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.issuesService.delete(id, context);
    return { message: 'Issue deleted successfully' };
  }
}
