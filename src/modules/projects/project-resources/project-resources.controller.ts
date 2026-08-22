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
import { ProjectResourcesService } from './project-resources.service';
import {
  CreateProjectResourceDto,
  UpdateProjectResourceDto,
} from './dto/project-resources.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Resources')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-resources')
export class ProjectResourcesController {
  constructor(private readonly resourcesService: ProjectResourcesService) {}

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
  @Permissions('project-resources.manage')
  @ApiOperation({ summary: 'Allocate resource/employee to project' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProjectResourceDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.resourcesService.create(dto, context);
    return { message: 'Resource allocated successfully', data };
  }

  @Get()
  @Permissions('project-resources.read')
  @ApiOperation({ summary: 'List resource allocations under project' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId: string) {
    const data = await this.resourcesService.getMany(projectId);
    return { message: 'Allocations retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('project-resources.read')
  @ApiOperation({ summary: 'Get resource allocation details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.resourcesService.getById(id);
    return { message: 'Allocation details retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('project-resources.manage')
  @ApiOperation({ summary: 'Update resource allocation details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectResourceDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.resourcesService.update(id, dto, context);
    return { message: 'Allocation updated successfully', data };
  }

  @Delete(':id')
  @Permissions('project-resources.manage')
  @ApiOperation({ summary: 'Remove resource allocation' })
  @ApiResponse({ type: SuccessResponseDto })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.resourcesService.remove(id, context);
    return { message: 'Resource deallocated successfully' };
  }
}
