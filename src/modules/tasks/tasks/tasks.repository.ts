import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { TaskFilterDto } from './dto/tasks.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TasksRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.TaskUncheckedCreateInput) {
    return this.prisma.task.create({
      data,
      include: {
        type: true,
        status: true,
        priority: true,
        labels: true,
        assignees: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findMany(filters: TaskFilterDto) {
    const where: Prisma.TaskWhereInput = {};

    if (filters.isDeleted === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.sprintId) where.sprintId = filters.sprintId;
    if (filters.milestoneId) where.milestoneId = filters.milestoneId;
    if (filters.statusId) where.statusId = filters.statusId;
    if (filters.priorityId) where.priorityId = filters.priorityId;
    if (filters.typeId) where.typeId = filters.typeId;

    if (filters.assigneeId) {
      where.assignees = {
        some: { id: filters.assigneeId },
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { code: { contains: filters.search } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ statusId: 'asc' }, { position: 'asc' }],
        include: {
          type: true,
          status: true,
          priority: true,
          labels: true,
          assignees: { select: { id: true, firstName: true, lastName: true } },
          parentTask: { select: { id: true, code: true, title: true } },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { data, totalCount };
  }

  async findById(id: string) {
    return this.prisma.task.findFirst({
      where: { id },
      include: {
        type: true,
        status: true,
        priority: true,
        labels: true,
        assignees: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        parentTask: { select: { id: true, code: true, title: true } },
        childTasks: {
          where: { deletedAt: null },
          include: {
            type: true,
            status: true,
            priority: true,
          },
        },
        checklists: {
          include: {
            items: { orderBy: { sortOrder: 'asc' } },
          },
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
            replies: {
              where: { deletedAt: null },
              include: {
                author: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
        attachments: true,
        watchers: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        dependencies: {
          include: {
            dependsOnTask: true,
          },
        },
        timelines: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.task.findUnique({
      where: { code },
    });
  }

  async update(id: string, data: Prisma.TaskUncheckedUpdateInput) {
    return this.prisma.task.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        type: true,
        status: true,
        priority: true,
        labels: true,
        assignees: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.task.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async permanentDelete(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async generateTaskCode() {
    const currentYear = new Date().getFullYear();
    const prefix = `TSK-${currentYear}-`;

    const lastTask = await this.prisma.task.findFirst({
      where: {
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: 'desc',
      },
      select: {
        code: true,
      },
    });

    let sequence = 1;
    if (lastTask && lastTask.code) {
      const parts = lastTask.code.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
    }

    return `${prefix}${String(sequence).padStart(6, '0')}`;
  }

  // Assignees helper
  async syncAssignees(taskId: string, assigneeIds: string[]) {
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignees: {
          set: assigneeIds.map((id) => ({ id })),
        },
      },
    });
  }

  // Tags/Labels helper
  async syncLabels(taskId: string, labelsList: string[]) {
    if (!labelsList) return;

    // Disconnect all existing labels
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        labels: {
          set: [],
        },
      },
    });

    // Create or connect new labels
    for (const name of labelsList) {
      const label = await this.prisma.taskLabel.upsert({
        where: { name },
        update: {},
        create: { name },
      });

      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          labels: {
            connect: { id: label.id },
          },
        },
      });
    }
  }

  // Kanban Position Helpers
  async getMaxPosition(statusId: string): Promise<number> {
    const agg = await this.prisma.task.aggregate({
      where: { statusId, deletedAt: null },
      _max: { position: true },
    });
    return agg._max.position !== null ? agg._max.position + 1 : 0;
  }

  async getTasksInColumn(statusId: string) {
    return this.prisma.task.findMany({
      where: { statusId, deletedAt: null },
      orderBy: { position: 'asc' },
    });
  }

  // Timeline operations
  async createTimeline(data: Prisma.TaskTimelineUncheckedCreateInput) {
    return this.prisma.taskTimeline.create({ data });
  }
}
