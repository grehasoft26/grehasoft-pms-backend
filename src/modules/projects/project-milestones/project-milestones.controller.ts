import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProjectMilestonesService } from './project-milestones.service';
import {
  CreateProjectMilestoneDto,
  UpdateProjectMilestoneDto,
} from './dto/project-milestones.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Milestones')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-milestones')
export class ProjectMilestonesController {
  constructor(private readonly milestonesService: ProjectMilestonesService) {}

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
  @Permissions('project-milestones.create')
  @ApiOperation({
    summary: 'Create project milestone with scheduling dependencies',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProjectMilestoneDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.milestonesService.create(dto, context);
    return { message: 'Milestone created successfully', data };
  }

  @Get()
  @Permissions('project-milestones.read')
  @ApiOperation({ summary: 'List all milestones under a project' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId: string) {
    const data = await this.milestonesService.getMany(projectId);
    return { message: 'Milestones retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('project-milestones.read')
  @ApiOperation({ summary: 'Get specific milestone details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.milestonesService.getById(id);
    return { message: 'Milestone retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('project-milestones.update')
  @ApiOperation({ summary: 'Update milestone details and dependency links' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectMilestoneDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.milestonesService.update(id, dto, context);
    return { message: 'Milestone updated successfully', data };
  }

  @Delete(':id')
  @Permissions('project-milestones.delete')
  @ApiOperation({ summary: 'Soft delete project milestone' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.milestonesService.delete(id, context);
    return { message: 'Milestone deleted successfully' };
  }
}
