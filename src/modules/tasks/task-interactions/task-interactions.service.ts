import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskInteractionsRepository } from './task-interactions.repository';
import { CreateTaskChecklistDto, CreateTaskChecklistItemDto, UpdateTaskChecklistItemDto, CreateTaskCommentDto, CreateTaskAttachmentDto, AddTaskDependencyDto, AddWatcherDto } from './dto/task-interactions.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TaskInteractionsService {
  constructor(
    private readonly repository: TaskInteractionsRepository,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  // 1. Checklist
  async createChecklist(dto: CreateTaskChecklistDto) {
    return this.repository.createChecklist(dto);
  }

  async createChecklistItem(dto: CreateTaskChecklistItemDto) {
    const item = await this.repository.createChecklistItem(dto);
    await this.recalculateTaskProgress(item.checklistId);
    return item;
  }

  async updateChecklistItem(id: string, dto: UpdateTaskChecklistItemDto) {
    const item = await this.repository.updateChecklistItem(id, dto);
    await this.recalculateTaskProgress(item.checklistId);
    return item;
  }

  async deleteChecklistItem(id: string) {
    const item = await this.repository.prisma.taskChecklistItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Checklist item not found');
    await this.repository.deleteChecklistItem(id);
    await this.recalculateTaskProgress(item.checklistId);
  }

  private async recalculateTaskProgress(checklistId: string) {
    const checklist = await this.repository.findChecklistById(checklistId);
    if (!checklist) return;

    // Get all checklists for the task
    const checklists = await this.repository.findChecklistsByTaskId(checklist.taskId);
    let totalItems = 0;
    let completedItems = 0;

    for (const cl of checklists) {
      for (const item of cl.items) {
        totalItems++;
        if (item.isCompleted) completedItems++;
      }
    }

    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Update parent task
    await this.repository.prisma.task.update({
      where: { id: checklist.taskId },
      data: { progressPercentage },
    });
  }

  // 2. Threaded Comments (Replies/Emoji Markdown supported)
  async createComment(dto: CreateTaskCommentDto, context: RequestContext) {
    const comment = await this.repository.createComment({
      taskId: dto.taskId,
      content: dto.content,
      parentCommentId: dto.parentCommentId,
      authorId: context.userId,
    });

    // Write timeline
    await this.repository.prisma.taskTimeline.create({
      data: {
        taskId: dto.taskId,
        event: 'COMMENT_ADDED',
        description: `User added a comment. Thread replies enabled.`,
        createdBy: context.userId,
      },
    });

    // Publish event
    this.eventEmitter.emit('task.comment.added', {
      taskId: dto.taskId,
      commentId: comment.id,
      authorId: context.userId,
    });

    return comment;
  }

  async deleteComment(id: string, context: RequestContext) {
    const before = await this.repository.findCommentById(id);
    if (!before) throw new NotFoundException('Comment not found');
    await this.repository.deleteComment(id, context.userId);
  }

  // 3. Attachments
  async createAttachment(dto: CreateTaskAttachmentDto, context: RequestContext) {
    const attachment = await this.repository.createAttachment({
      ...dto,
      uploadedById: context.userId,
    });

    await this.repository.prisma.taskTimeline.create({
      data: {
        taskId: dto.taskId,
        event: 'ATTACHMENT_ADDED',
        description: `Attachment "${dto.name}" uploaded.`,
        createdBy: context.userId,
      },
    });

    return attachment;
  }

  async deleteAttachment(id: string, context: RequestContext) {
    const before = await this.repository.findAttachmentById(id);
    if (!before) throw new NotFoundException('Attachment not found');
    await this.repository.deleteAttachment(id);
  }

  // 4. Watchers
  async addWatcher(dto: AddWatcherDto, context: RequestContext) {
    const watcher = await this.repository.addWatcher(dto.taskId, dto.userId);
    
    await this.repository.prisma.taskTimeline.create({
      data: {
        taskId: dto.taskId,
        event: 'WATCHER_ADDED',
        description: `Watcher enrolled.`,
        createdBy: context.userId,
      },
    });

    return watcher;
  }

  async removeWatcher(taskId: string, userId: string, context: RequestContext) {
    await this.repository.removeWatcher(taskId, userId);
  }

  // 5. Dependencies
  async addDependency(dto: AddTaskDependencyDto, context: RequestContext) {
    if (dto.taskId === dto.dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    // Check circular dependency
    const hasCycle = await this.checkCircularDependency(dto.taskId, dto.dependsOnTaskId);
    if (hasCycle) {
      throw new BadRequestException(`Circular dependency detected: Task cannot depend on task ID ${dto.dependsOnTaskId}`);
    }

    const dep = await this.repository.addDependency(dto.taskId, dto.dependsOnTaskId, dto.type);

    await this.repository.prisma.taskTimeline.create({
      data: {
        taskId: dto.taskId,
        event: 'DEPENDENCY_ADDED',
        description: `Task scheduling dependency added. Type: ${dto.type}`,
        createdBy: context.userId,
      },
    });

    return dep;
  }

  private async checkCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    const visited = new Set<string>();
    
    const check = async (currentId: string): Promise<boolean> => {
      if (currentId === taskId) return true;
      if (visited.has(currentId)) return false;
      visited.add(currentId);

      const deps = await this.repository.prisma.taskDependency.findMany({
        where: { taskId: currentId },
      });

      for (const dep of deps) {
        if (dep.dependsOnTaskId) {
          const hasCycle = await check(dep.dependsOnTaskId);
          if (hasCycle) return true;
        }
      }
      return false;
    };

    return check(dependsOnTaskId);
  }
}
