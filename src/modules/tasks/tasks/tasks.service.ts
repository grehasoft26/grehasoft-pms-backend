import { Injectable, NotFoundException } from '@nestjs/common';
import { MilestoneStatus, ProjectStatus } from '@prisma/client';
import { TasksRepository } from './tasks.repository';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  CloneTaskDto,
} from './dto/tasks.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  constructor(
    private readonly repository: TasksRepository,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateTaskDto, context: RequestContext) {
    const code = await this.repository.generateTaskCode();

    // Position
    const position = await this.repository.getMaxPosition(dto.statusId);

    // Parent Task validation
    if (dto.parentTaskId) {
      const parent = await this.repository.findById(dto.parentTaskId);
      if (!parent)
        throw new NotFoundException(
          `Parent task with ID ${dto.parentTaskId} not found`,
        );
    }

    // Remaining hours
    const estimatedHours = dto.estimatedHours || 0;
    const remainingHours = estimatedHours;

    // Recurrence
    let nextRecurrenceDate: Date | null = null;
    if (dto.isRecurring && dto.recurrenceRule) {
      nextRecurrenceDate = this.calculateNextRecurrence(
        new Date(),
        dto.recurrenceRule,
        dto.cronExpression,
      );
    }

    const task = await this.repository.create({
      code,
      projectId: dto.projectId,
      milestoneId: dto.milestoneId,
      sprintId: dto.sprintId,
      title: dto.title,
      description: dto.description,
      typeId: dto.typeId,
      statusId: dto.statusId,
      priorityId: dto.priorityId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      estimatedHours,
      actualHours: 0,
      remainingHours,
      storyPoints: dto.storyPoints || null,
      position,
      isRecurring: dto.isRecurring || false,
      recurrenceRule: dto.recurrenceRule || null,
      cronExpression: dto.cronExpression || null,
      nextRecurrenceDate,
      parentTaskId: dto.parentTaskId || null,
      createdBy: context.userId,
    });

    // Assignees & Labels
    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      await this.repository.syncAssignees(task.id, dto.assigneeIds);
    }
    if (dto.labels && dto.labels.length > 0) {
      await this.repository.syncLabels(task.id, dto.labels);
    }

    // Write Timeline
    await this.repository.createTimeline({
      taskId: task.id,
      event: 'TASK_CREATED',
      description: `Task "${task.title}" (${code}) created.`,
      createdBy: context.userId,
    });

    // Publish events
    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      this.eventEmitter.emit('task.assigned', {
        taskId: task.id,
        assigneeIds: dto.assigneeIds,
      });
    }
    this.eventEmitter.emit('task.status.changed', {
      taskId: task.id,
      beforeStatusId: null,
      afterStatusId: dto.statusId,
    });

    // Audit Log
    this.logger.audit(context.userId, 'Create Task', 'task', task, {
      after: task,
    });

    await this.recalculateProgress(task.projectId, task.milestoneId);

    return this.getById(task.id);
  }

  async getMany(filters: TaskFilterDto) {
    return this.repository.findMany(filters);
  }

  async getById(id: string) {
    const task = await this.repository.findById(id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, context: RequestContext) {
    const before = await this.getById(id);

    const estimatedHours =
      dto.estimatedHours !== undefined
        ? dto.estimatedHours
        : Number(before.estimatedHours);
    const actualHours =
      dto.actualHours !== undefined
        ? dto.actualHours
        : Number(before.actualHours);
    const remainingHours =
      estimatedHours - actualHours >= 0 ? estimatedHours - actualHours : 0;

    let nextRecurrenceDate = before.nextRecurrenceDate;
    if (dto.isRecurring || dto.recurrenceRule) {
      const isRecur =
        dto.isRecurring !== undefined ? dto.isRecurring : before.isRecurring;
      const rule =
        dto.recurrenceRule !== undefined
          ? dto.recurrenceRule
          : before.recurrenceRule;
      const cron =
        dto.cronExpression !== undefined
          ? dto.cronExpression
          : before.cronExpression;
      if (isRecur && rule) {
        nextRecurrenceDate = this.calculateNextRecurrence(
          new Date(),
          rule,
          cron,
        );
      } else {
        nextRecurrenceDate = null;
      }
    }

    const updated = await this.repository.update(id, {
      milestoneId: dto.milestoneId,
      sprintId: dto.sprintId,
      title: dto.title,
      description: dto.description,
      typeId: dto.typeId,
      statusId: dto.statusId,
      priorityId: dto.priorityId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      estimatedHours,
      actualHours,
      remainingHours,
      storyPoints: dto.storyPoints,
      progressPercentage: dto.progressPercentage,
      parentTaskId: dto.parentTaskId,
      isRecurring: dto.isRecurring,
      recurrenceRule: dto.recurrenceRule,
      cronExpression: dto.cronExpression,
      nextRecurrenceDate,
      updatedBy: context.userId,
    });

    // Assignees & Labels sync
    if (dto.assigneeIds !== undefined) {
      await this.repository.syncAssignees(id, dto.assigneeIds);
      this.eventEmitter.emit('task.assigned', {
        taskId: id,
        assigneeIds: dto.assigneeIds,
      });
    }
    if (dto.labels !== undefined) {
      await this.repository.syncLabels(id, dto.labels);
    }

    // Timeline and Events publishing
    if (dto.statusId && dto.statusId !== before.statusId) {
      await this.repository.createTimeline({
        taskId: id,
        event: 'STATUS_CHANGED',
        description: `Task status updated.`,
        createdBy: context.userId,
      });

      this.eventEmitter.emit('task.status.changed', {
        taskId: id,
        beforeStatusId: before.statusId,
        afterStatusId: dto.statusId,
      });

      // If status matches "DONE" code, emit completed event
      const doneStatus = await this.repository.prisma.taskStatus.findFirst({
        where: { id: dto.statusId },
      });
      if (doneStatus && doneStatus.code === 'DONE') {
        this.eventEmitter.emit('task.completed', { taskId: id });
        await this.repository.createTimeline({
          taskId: id,
          event: 'TASK_COMPLETED',
          description: `Task completed.`,
          createdBy: context.userId,
        });
      }
    }

    this.logger.audit(context.userId, 'Update Task', 'task', updated, {
      before,
      after: updated,
    });

    await this.recalculateProgress(updated.projectId, updated.milestoneId);
    if (before.milestoneId && before.milestoneId !== updated.milestoneId) {
      await this.recalculateProgress(before.projectId, before.milestoneId);
    }

    return this.getById(id);
  }

  // Kanban drag and drop position ordering (Refinement 7)
  async updatePosition(
    id: string,
    statusId: string,
    newPosition: number,
    context: RequestContext,
  ) {
    const task = await this.getById(id);
    const oldStatusId = task.statusId;
    const oldPosition = task.position;

    const prisma = this.repository.prisma;

    if (oldStatusId !== statusId) {
      // 1. Move to a different column
      // Shift down existing items in the destination column
      await prisma.task.updateMany({
        where: { statusId, position: { gte: newPosition }, deletedAt: null },
        data: { position: { increment: 1 } },
      });

      // Update current item status and position
      await prisma.task.update({
        where: { id },
        data: { statusId, position: newPosition },
      });

      // Shift up existing items in the source column
      await prisma.task.updateMany({
        where: {
          statusId: oldStatusId,
          position: { gt: oldPosition },
          deletedAt: null,
        },
        data: { position: { decrement: 1 } },
      });

      // Write timeline
      await this.repository.createTimeline({
        taskId: id,
        event: 'KANBAN_MOVE',
        description: `Task moved to different Kanban column. Position: ${newPosition}`,
        createdBy: context.userId,
      });

      this.eventEmitter.emit('task.status.changed', {
        taskId: id,
        beforeStatusId: oldStatusId,
        afterStatusId: statusId,
      });
    } else {
      // 2. Re-order within the same column
      if (newPosition > oldPosition) {
        // Moving down: shift items in between up
        await prisma.task.updateMany({
          where: {
            statusId,
            position: { gt: oldPosition, lte: newPosition },
            deletedAt: null,
          },
          data: { position: { decrement: 1 } },
        });
      } else if (newPosition < oldPosition) {
        // Moving up: shift items in between down
        await prisma.task.updateMany({
          where: {
            statusId,
            position: { gte: newPosition, lt: oldPosition },
            deletedAt: null,
          },
          data: { position: { increment: 1 } },
        });
      }

      await prisma.task.update({
        where: { id },
        data: { position: newPosition },
      });

      // Write timeline
      await this.repository.createTimeline({
        taskId: id,
        event: 'KANBAN_REORDER',
        description: `Task position reordered within same column to: ${newPosition}`,
        createdBy: context.userId,
      });
    }

    await this.recalculateProgress(task.projectId, task.milestoneId);

    return this.getById(id);
  }

  async clone(id: string, dto: CloneTaskDto, context: RequestContext) {
    const source = await this.getById(id);
    const code = await this.repository.generateTaskCode();
    const position = await this.repository.getMaxPosition(source.statusId);

    const task = await this.repository.create({
      code,
      projectId: dto.projectId || source.projectId,
      milestoneId: source.milestoneId,
      sprintId: source.sprintId,
      title: dto.title,
      description: source.description,
      typeId: source.typeId,
      statusId: source.statusId,
      priorityId: source.priorityId,
      dueDate: source.dueDate,
      startDate: source.startDate,
      estimatedHours: source.estimatedHours,
      actualHours: 0,
      remainingHours: source.estimatedHours,
      storyPoints: source.storyPoints,
      position,
      parentTaskId: dto.parentTaskId || source.parentTaskId,
      createdBy: context.userId,
    });

    // Copy watchers, checklists
    const checklists = await this.repository.prisma.taskChecklist.findMany({
      where: { taskId: id },
      include: { items: true },
    });

    for (const cl of checklists) {
      const newCl = await this.repository.prisma.taskChecklist.create({
        data: {
          taskId: task.id,
          title: cl.title,
        },
      });
      for (const item of cl.items) {
        await this.repository.prisma.taskChecklistItem.create({
          data: {
            checklistId: newCl.id,
            title: item.title,
            sortOrder: item.sortOrder,
            isCompleted: false,
          },
        });
      }
    }

    await this.repository.createTimeline({
      taskId: task.id,
      event: 'TASK_CLONED',
      description: `Task cloned from ${source.code}`,
      createdBy: context.userId,
    });

    await this.recalculateProgress(task.projectId, task.milestoneId);

    return this.getById(task.id);
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id, context.userId);

    await this.repository.createTimeline({
      taskId: id,
      event: 'TASK_SOFT_DELETED',
      description: `Task was soft deleted.`,
      createdBy: context.userId,
    });

    this.logger.audit(
      context.userId,
      'Delete Task',
      'task',
      { id },
      { before },
    );

    await this.recalculateProgress(before.projectId, before.milestoneId);
  }

  async restore(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.restore(id);

    await this.repository.createTimeline({
      taskId: id,
      event: 'TASK_RESTORED',
      description: `Task was restored from soft delete.`,
      createdBy: context.userId,
    });

    this.logger.audit(
      context.userId,
      'Restore Task',
      'task',
      { id },
      { before },
    );

    await this.recalculateProgress(before.projectId, before.milestoneId);

    return this.getById(id);
  }

  async permanentDelete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.permanentDelete(id);
    this.logger.audit(
      context.userId,
      'Permanent Delete Task',
      'task',
      { id },
      { before },
    );

    await this.recalculateProgress(before.projectId, before.milestoneId);
  }

  // Recurring Tasks Cron Scheduler (Refinement 8)
  @Cron('0 0 * * *') // Run daily at midnight
  async handleRecurringTasks() {
    this.logger.log(
      'Running recurring tasks generation scheduler...',
      'Scheduler',
    );
    const now = new Date();

    const recurringTasks = await this.repository.prisma.task.findMany({
      where: {
        isRecurring: true,
        deletedAt: null,
        nextRecurrenceDate: { lte: now },
      },
    });

    for (const t of recurringTasks) {
      try {
        const nextCode = await this.repository.generateTaskCode();
        const nextPos = await this.repository.getMaxPosition(t.statusId);

        // Spawn cloned task
        await this.repository.create({
          code: nextCode,
          projectId: t.projectId,
          milestoneId: t.milestoneId,
          sprintId: t.sprintId,
          title: `${t.title} (Recurring)`,
          description: t.description,
          typeId: t.typeId,
          statusId: t.statusId,
          priorityId: t.priorityId,
          estimatedHours: t.estimatedHours,
          remainingHours: t.estimatedHours,
          storyPoints: t.storyPoints,
          position: nextPos,
          parentTaskId: t.parentTaskId,
          createdBy: 'system-scheduler',
        });

        // Update original recurring task nextRecurrenceDate
        const rule = t.recurrenceRule || 'DAILY';
        const nextDate = this.calculateNextRecurrence(
          new Date(),
          rule,
          t.cronExpression,
        );

        await this.repository.update(t.id, {
          nextRecurrenceDate: nextDate,
        });

        this.logger.log(
          `Generated recurring task instance for Task Code: ${t.code}`,
          'Scheduler',
        );
      } catch (e) {
        this.logger.error(
          `Failed to process recurring task ${t.id}: ${(e as Error).message}`,
          'Scheduler',
        );
      }
    }
  }

  private calculateNextRecurrence(
    baseDate: Date,
    rule: string,
    _cronExpr?: string | null,
  ): Date {
    const next = new Date(baseDate);
    if (_cronExpr) {
      // cronExpression is passed
    }
    if (rule === 'DAILY') {
      next.setDate(next.getDate() + 1);
    } else if (rule === 'WEEKLY') {
      next.setDate(next.getDate() + 7);
    } else if (rule === 'MONTHLY') {
      next.setMonth(next.getMonth() + 1);
    } else if (rule === 'YEARLY') {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      // Default to daily for custom cron expressions in this simplified mock implementation
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  async recalculateProgress(projectId: string, milestoneId?: string | null) {
    const prisma = this.repository.prisma;

    if (milestoneId) {
      // 1. Get all tasks for this milestone (not deleted)
      const tasks = await prisma.task.findMany({
        where: { milestoneId, deletedAt: null },
        include: { status: true },
      });

      let milestoneProgress = 0;
      if (tasks.length > 0) {
        const taskProgressMap: Record<string, number> = {
          TODO: 0,
          IN_PROGRESS: 50,
          IN_REVIEW: 50,
          DONE: 100,
          BLOCKED: 0,
          todo: 0,
          in_progress: 50,
          in_review: 50,
          done: 100,
          blocked: 0,
        };

        const totalProgress = tasks.reduce((sum, t) => {
          const code = t.status?.code || 'TODO';
          return (
            sum +
            (taskProgressMap[code] !== undefined ? taskProgressMap[code] : 0)
          );
        }, 0);

        milestoneProgress = Math.round(totalProgress / tasks.length);
      }

      // Determine milestone status
      let milestoneStatus: MilestoneStatus = MilestoneStatus.PENDING;
      const hasBlocked = tasks.some((t) => t.status?.code === 'BLOCKED');
      if (hasBlocked) {
        milestoneStatus = MilestoneStatus.DELAYED;
      } else if (milestoneProgress === 0) {
        milestoneStatus = MilestoneStatus.PENDING;
      } else if (milestoneProgress < 100) {
        milestoneStatus = MilestoneStatus.IN_PROGRESS;
      } else if (milestoneProgress === 100) {
        milestoneStatus = MilestoneStatus.COMPLETED;
      }

      await prisma.projectMilestone.update({
        where: { id: milestoneId },
        data: {
          completionPercentage: milestoneProgress,
          status: milestoneStatus,
        },
      });
    }

    // 2. Recalculate project progress
    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId, deletedAt: null },
    });

    let projectProgress = 0;
    if (milestones.length > 0) {
      const totalMilestoneProgress = milestones.reduce(
        (sum, m) => sum + (m.completionPercentage || 0),
        0,
      );
      projectProgress = Math.round(totalMilestoneProgress / milestones.length);
    }

    // Determine project status
    let projectStatus: ProjectStatus = ProjectStatus.PLANNING;
    const hasBlockedMilestones = milestones.some(
      (m) => m.status === MilestoneStatus.DELAYED,
    );
    if (hasBlockedMilestones) {
      projectStatus = ProjectStatus.ACTIVE;
    } else if (projectProgress === 0) {
      projectStatus = ProjectStatus.PLANNING;
    } else if (projectProgress < 100) {
      projectStatus = ProjectStatus.ACTIVE;
    } else if (projectProgress === 100) {
      projectStatus = ProjectStatus.COMPLETED;
    }

    // Read current status to avoid overriding manual override statuses like ARCHIVED or ON_HOLD
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });

    const updateData: { completionPercentage: number; status?: ProjectStatus } =
      {
        completionPercentage: projectProgress,
      };
    if (
      currentProject &&
      currentProject.status !== ProjectStatus.ARCHIVED &&
      currentProject.status !== ProjectStatus.ON_HOLD
    ) {
      updateData.status = projectStatus;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });
  }
}
