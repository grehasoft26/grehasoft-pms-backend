import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, ProjectFilterDto, CloneProjectDto } from './dto/projects.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Projects')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

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
  @Permissions('projects.create')
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProjectDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.projectsService.create(dto, context);
    return { message: 'Project created successfully', data };
  }

  @Post('from-proposal')
  @Permissions('projects.create')
  @ApiOperation({ summary: 'Convert an accepted Proposal into a Project' })
  @ApiResponse({ type: SuccessResponseDto })
  async createFromProposal(
    @Body('proposalId') proposalId: string,
    @Body('categoryId') categoryId: string,
    @Body('managerId') managerId: string,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.projectsService.createFromProposal(proposalId, categoryId, managerId, context);
    return { message: 'Project successfully created from Proposal', data };
  }

  @Get()
  @Permissions('projects.read')
  @ApiOperation({ summary: 'List projects with filtering, sorting, and pagination' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query() query: ProjectFilterDto) {
    const { data, totalCount } = await this.projectsService.getMany(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Projects retrieved successfully',
      data,
      meta: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  @Get(':id')
  @Permissions('projects.read')
  @ApiOperation({ summary: 'Get specific project details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.projectsService.getById(id);
    return { message: 'Project retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('projects.update')
  @ApiOperation({ summary: 'Update project details, budget, or timeline' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.projectsService.update(id, dto, context);
    return { message: 'Project updated successfully', data };
  }

  @Post(':id/archive')
  @Permissions('projects.update')
  @ApiOperation({ summary: 'Archive a project' })
  @ApiResponse({ type: SuccessResponseDto })
  async archive(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.projectsService.archive(id, context);
    return { message: 'Project archived successfully', data };
  }

  @Post(':id/restore')
  @Permissions('projects.restore')
  @ApiOperation({ summary: 'Restore an archived/soft-deleted project' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.projectsService.restore(id, context);
    return { message: 'Project restored successfully', data };
  }

  @Post(':id/clone')
  @Permissions('projects.clone')
  @ApiOperation({ summary: 'Clone/Duplicate a project template structure' })
  @ApiResponse({ type: SuccessResponseDto })
  async clone(@Param('id') id: string, @Body() dto: CloneProjectDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.projectsService.clone(id, dto, context);
    return { message: 'Project cloned successfully', data };
  }

  @Delete(':id')
  @Permissions('projects.delete')
  @ApiOperation({ summary: 'Soft delete a project' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.projectsService.delete(id, context.userId);
    return { message: 'Project soft-deleted successfully' };
  }

  @Delete(':id/permanent')
  @Permissions('projects.permanent-delete')
  @ApiOperation({ summary: 'Permanently hard-delete a project (Super Admin only)' })
  @ApiResponse({ type: SuccessResponseDto })
  async permanentDelete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.projectsService.permanentDelete(id, context);
    return { message: 'Project permanently deleted' };
  }
}
