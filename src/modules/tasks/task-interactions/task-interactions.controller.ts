import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TaskInteractionsService } from './task-interactions.service';
import { CreateTaskChecklistDto, CreateTaskChecklistItemDto, UpdateTaskChecklistItemDto, CreateTaskCommentDto, CreateTaskAttachmentDto, AddWatcherDto, AddTaskDependencyDto } from './dto/task-interactions.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Task Interactions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('task-interactions')
export class TaskInteractionsController {
  constructor(private readonly interactionsService: TaskInteractionsService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  // Checklists
  @Post('checklists')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Create checklist group on task' })
  @ApiResponse({ type: SuccessResponseDto })
  async createChecklist(@Body() dto: CreateTaskChecklistDto) {
    const data = await this.interactionsService.createChecklist(dto);
    return { message: 'Checklist created successfully', data };
  }

  @Post('checklists/items')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Add checklist item to group' })
  @ApiResponse({ type: SuccessResponseDto })
  async createChecklistItem(@Body() dto: CreateTaskChecklistItemDto) {
    const data = await this.interactionsService.createChecklistItem(dto);
    return { message: 'Checklist item added', data };
  }

  @Patch('checklists/items/:itemId')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Toggle completion or update checklist item text' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateChecklistItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateTaskChecklistItemDto
  ) {
    const data = await this.interactionsService.updateChecklistItem(itemId, dto);
    return { message: 'Checklist item updated', data };
  }

  @Delete('checklists/items/:itemId')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Delete checklist item' })
  @ApiResponse({ type: SuccessResponseDto })
  async deleteChecklistItem(@Param('itemId') itemId: string) {
    await this.interactionsService.deleteChecklistItem(itemId);
    return { message: 'Checklist item deleted' };
  }

  // Comments
  @Post('comments')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Add threaded Markdown Comment' })
  @ApiResponse({ type: SuccessResponseDto })
  async createComment(@Body() dto: CreateTaskCommentDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.interactionsService.createComment(dto, context);
    return { message: 'Comment added successfully', data };
  }

  @Delete('comments/:commentId')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Delete Comment' })
  @ApiResponse({ type: SuccessResponseDto })
  async deleteComment(@Param('commentId') commentId: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.interactionsService.deleteComment(commentId, context);
    return { message: 'Comment deleted successfully' };
  }

  // Watchers
  @Post('watchers')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Add watcher subscriber' })
  @ApiResponse({ type: SuccessResponseDto })
  async addWatcher(@Body() dto: AddWatcherDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.interactionsService.addWatcher(dto, context);
    return { message: 'Watcher enrolled successfully', data };
  }

  @Delete('watchers')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Remove watcher' })
  @ApiResponse({ type: SuccessResponseDto })
  async removeWatcher(
    @Query('taskId') taskId: string,
    @Query('userId') userId: string,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    await this.interactionsService.removeWatcher(taskId, userId, context);
    return { message: 'Watcher removed successfully' };
  }

  // Attachments
  @Post('attachments')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Add file attachment metadata' })
  @ApiResponse({ type: SuccessResponseDto })
  async createAttachment(@Body() dto: CreateTaskAttachmentDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.interactionsService.createAttachment(dto, context);
    return { message: 'Attachment registered successfully', data };
  }

  @Delete('attachments/:attachmentId')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Delete attachment' })
  @ApiResponse({ type: SuccessResponseDto })
  async deleteAttachment(@Param('attachmentId') attachmentId: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.interactionsService.deleteAttachment(attachmentId, context);
    return { message: 'Attachment deleted successfully' };
  }

  // Dependencies
  @Post('dependencies')
  @Permissions('tasks.update')
  @ApiOperation({ summary: 'Add task-to-task scheduling dependency' })
  @ApiResponse({ type: SuccessResponseDto })
  async addDependency(@Body() dto: AddTaskDependencyDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.interactionsService.addDependency(dto, context);
    return { message: 'Task scheduling dependency created successfully', data };
  }
}
