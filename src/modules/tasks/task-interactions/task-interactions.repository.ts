import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, DependencyType } from '@prisma/client';

@Injectable()
export class TaskInteractionsRepository {
  constructor(public readonly prisma: PrismaService) {}

  // 1. Checklists & Items
  async createChecklist(data: Prisma.TaskChecklistUncheckedCreateInput) {
    return this.prisma.taskChecklist.create({
      data,
      include: { items: true },
    });
  }

  async findChecklistById(id: string) {
    return this.prisma.taskChecklist.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findChecklistsByTaskId(taskId: string) {
    return this.prisma.taskChecklist.findMany({
      where: { taskId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async createChecklistItem(
    data: Prisma.TaskChecklistItemUncheckedCreateInput,
  ) {
    return this.prisma.taskChecklistItem.create({ data });
  }

  async updateChecklistItem(
    id: string,
    data: Prisma.TaskChecklistItemUncheckedUpdateInput,
  ) {
    return this.prisma.taskChecklistItem.update({
      where: { id },
      data,
    });
  }

  async deleteChecklist(id: string) {
    return this.prisma.taskChecklist.delete({ where: { id } });
  }

  async deleteChecklistItem(id: string) {
    return this.prisma.taskChecklistItem.delete({ where: { id } });
  }

  // 2. Threaded Comments
  async createComment(data: Prisma.TaskCommentUncheckedCreateInput) {
    return this.prisma.taskComment.create({
      data,
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        replies: true,
      },
    });
  }

  async findCommentById(id: string) {
    return this.prisma.taskComment.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        replies: {
          where: { deletedAt: null },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async deleteComment(id: string, userId: string) {
    return this.prisma.taskComment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // 3. Attachments
  async createAttachment(data: Prisma.TaskAttachmentUncheckedCreateInput) {
    return this.prisma.taskAttachment.create({ data });
  }

  async findAttachmentById(id: string) {
    return this.prisma.taskAttachment.findUnique({ where: { id } });
  }

  async deleteAttachment(id: string) {
    return this.prisma.taskAttachment.delete({ where: { id } });
  }

  // 4. Watchers
  async addWatcher(taskId: string, userId: string) {
    return this.prisma.taskWatcher.create({
      data: {
        taskId,
        userId,
      },
    });
  }

  async removeWatcher(taskId: string, userId: string) {
    return this.prisma.taskWatcher.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });
  }

  async findWatchersByTaskId(taskId: string) {
    return this.prisma.taskWatcher.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  // 5. Scheduling Dependencies
  async addDependency(
    taskId: string,
    dependsOnTaskId: string,
    type: DependencyType = DependencyType.FS,
  ) {
    return this.prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
        type,
      },
    });
  }

  async clearDependencies(taskId: string) {
    return this.prisma.taskDependency.deleteMany({
      where: { taskId },
    });
  }

  async getDependencies(taskId: string) {
    return this.prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOnTask: true,
      },
    });
  }
}
