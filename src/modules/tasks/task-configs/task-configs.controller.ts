import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TaskConfigsService } from './task-configs.service';
import { CreateTaskTypeDto, CreateTaskStatusDto, CreateTaskPriorityDto, CreateTaskLabelDto } from './dto/task-configs.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Task Configuration')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('task-configs')
export class TaskConfigsController {
  constructor(private readonly configsService: TaskConfigsService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  // Types
  @Post('types')
  @Permissions('task-configs.manage')
  @ApiOperation({ summary: 'Create a custom Task Type' })
  @ApiResponse({ type: SuccessResponseDto })
  async createType(@Body() dto: CreateTaskTypeDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.configsService.createType(dto, context);
    return { message: 'Task type created successfully', data };
  }

  @Get('types')
  @Permissions('task-configs.read')
  @ApiOperation({ summary: 'Get all Task Types' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTypes() {
    const data = await this.configsService.getTypes();
    return { message: 'Task types retrieved successfully', data };
  }

  // Statuses
  @Post('statuses')
  @Permissions('task-configs.manage')
  @ApiOperation({ summary: 'Create custom Task Status' })
  @ApiResponse({ type: SuccessResponseDto })
  async createStatus(@Body() dto: CreateTaskStatusDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.configsService.createStatus(dto, context);
    return { message: 'Task status created successfully', data };
  }

  @Get('statuses')
  @Permissions('task-configs.read')
  @ApiOperation({ summary: 'Get all custom Task Statuses' })
  @ApiResponse({ type: SuccessResponseDto })
  async getStatuses() {
    const data = await this.configsService.getStatuses();
    return { message: 'Task statuses retrieved successfully', data };
  }

  // Priorities
  @Post('priorities')
  @Permissions('task-configs.manage')
  @ApiOperation({ summary: 'Create custom Task Priority' })
  @ApiResponse({ type: SuccessResponseDto })
  async createPriority(@Body() dto: CreateTaskPriorityDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.configsService.createPriority(dto, context);
    return { message: 'Task priority created successfully', data };
  }

  @Get('priorities')
  @Permissions('task-configs.read')
  @ApiOperation({ summary: 'Get all Task Priorities' })
  @ApiResponse({ type: SuccessResponseDto })
  async getPriorities() {
    const data = await this.configsService.getPriorities();
    return { message: 'Task priorities retrieved successfully', data };
  }

  // Labels
  @Post('labels')
  @Permissions('task-configs.manage')
  @ApiOperation({ summary: 'Create custom Task Label' })
  @ApiResponse({ type: SuccessResponseDto })
  async createLabel(@Body() dto: CreateTaskLabelDto) {
    const data = await this.configsService.createLabel(dto);
    return { message: 'Label created successfully', data };
  }

  @Get('labels')
  @Permissions('task-configs.read')
  @ApiOperation({ summary: 'Get all Task Labels' })
  @ApiResponse({ type: SuccessResponseDto })
  async getLabels() {
    const data = await this.configsService.getLabels();
    return { message: 'Labels retrieved successfully', data };
  }
}
