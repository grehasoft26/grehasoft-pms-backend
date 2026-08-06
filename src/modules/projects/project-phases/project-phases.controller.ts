import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectPhasesService } from './project-phases.service';
import { CreateProjectPhaseDto, UpdateProjectPhaseDto } from './dto/project-phases.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Phases')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-phases')
export class ProjectPhasesController {
  constructor(private readonly phasesService: ProjectPhasesService) {}

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
  @Permissions('project-phases.create')
  @ApiOperation({ summary: 'Create a project phase' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProjectPhaseDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.phasesService.create(dto, context);
    return { message: 'Phase created successfully', data };
  }

  @Get()
  @Permissions('project-phases.read')
  @ApiOperation({ summary: 'List phases under a project' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId: string) {
    const data = await this.phasesService.getMany(projectId);
    return { message: 'Phases retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('project-phases.read')
  @ApiOperation({ summary: 'Get specific phase details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.phasesService.getById(id);
    return { message: 'Phase retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('project-phases.update')
  @ApiOperation({ summary: 'Update project phase' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectPhaseDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.phasesService.update(id, dto, context);
    return { message: 'Phase updated successfully', data };
  }

  @Delete(':id')
  @Permissions('project-phases.delete')
  @ApiOperation({ summary: 'Delete project phase' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.phasesService.delete(id, context);
    return { message: 'Phase deleted successfully' };
  }
}
