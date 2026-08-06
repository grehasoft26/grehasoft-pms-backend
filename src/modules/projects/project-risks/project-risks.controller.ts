import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectRisksService } from './project-risks.service';
import { CreateProjectRiskDto, UpdateProjectRiskDto } from './dto/project-risks.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Risks')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-risks')
export class ProjectRisksController {
  constructor(private readonly risksService: ProjectRisksService) {}

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
  @Permissions('project-risks.create')
  @ApiOperation({ summary: 'Register risk for a project' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProjectRiskDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.risksService.create(dto, context);
    return { message: 'Risk registered successfully', data };
  }

  @Get()
  @Permissions('project-risks.read')
  @ApiOperation({ summary: 'List project risks' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId: string) {
    const data = await this.risksService.getMany(projectId);
    return { message: 'Risks retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('project-risks.read')
  @ApiOperation({ summary: 'Get specific risk details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.risksService.getById(id);
    return { message: 'Risk retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('project-risks.update')
  @ApiOperation({ summary: 'Update project risk details and mitigation plan' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectRiskDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.risksService.update(id, dto, context);
    return { message: 'Risk updated successfully', data };
  }

  @Delete(':id')
  @Permissions('project-risks.delete')
  @ApiOperation({ summary: 'Soft delete project risk' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.risksService.delete(id, context);
    return { message: 'Risk deleted successfully' };
  }
}
