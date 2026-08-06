import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto, CloneTaskDto, UpdateTaskPositionDto } from './dto/tasks.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Tasks')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

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
  @Permissions('tasks.create')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateTaskDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.tasksService.create(dto, context);
    return { message: 'Task created successfully', data };
  }

  @Get()
  @Permissions('tasks.read')
  @ApiOperation({ summary: 'List tasks with advanced filtering and pagination' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query() query: TaskFilterDto) {
    const { data, totalCount } = await this.tasksService.getMany(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Tasks retrieved successfully',
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
  @Permissions('tasks.read')
  @ApiOperation({ summary: 'Get specific task details (with subtasks tree, comments, and checklists)' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.tasksService.getById(id);
    return { message: 'Task details retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Update task properties, story points, or estimated hours' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.tasksService.update(id, dto, context);
    return { message: 'Task updated successfully', data };
  }

  @Patch(':id/position')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Update Kanban status and sort position (Drag-and-Drop)' })
  @ApiResponse({ type: SuccessResponseDto })
  async updatePosition(
    @Param('id') id: string,
    @Body() dto: UpdateTaskPositionDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.tasksService.updatePosition(id, dto.statusId, dto.position, context);
    return { message: 'Task column position updated successfully', data };
  }

  @Post(':id/clone')
  @Permissions('tasks.clone')
  @ApiOperation({ summary: 'Clone/Duplicate task' })
  @ApiResponse({ type: SuccessResponseDto })
  async clone(@Param('id') id: string, @Body() dto: CloneTaskDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.tasksService.clone(id, dto, context);
    return { message: 'Task cloned successfully', data };
  }

  @Post(':id/restore')
  @Permissions('tasks.restore')
  @ApiOperation({ summary: 'Restore soft-deleted task' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.tasksService.restore(id, context);
    return { message: 'Task restored successfully', data };
  }

  @Delete(':id')
  @Permissions('tasks.delete')
  @ApiOperation({ summary: 'Soft delete a task' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.tasksService.delete(id, context);
    return { message: 'Task soft-deleted successfully' };
  }

  @Delete(':id/permanent')
  @Permissions('tasks.permanent-delete')
  @ApiOperation({ summary: 'Permanently hard delete a task (Super Admin only)' })
  @ApiResponse({ type: SuccessResponseDto })
  async permanentDelete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.tasksService.permanentDelete(id, context);
    return { message: 'Task permanently deleted' };
  }
}
