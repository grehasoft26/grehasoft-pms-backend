import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskConfigsRepository {
  constructor(public readonly prisma: PrismaService) {}

  // 1. Task Types CRUD
  async createType(data: Prisma.TaskTypeCreateInput) {
    return this.prisma.taskType.create({ data });
  }

  async findTypes() {
    return this.prisma.taskType.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findTypeById(id: string) {
    return this.prisma.taskType.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findTypeByCode(code: string) {
    return this.prisma.taskType.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async updateType(id: string, data: Prisma.TaskTypeUpdateInput) {
    return this.prisma.taskType.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async deleteType(id: string, userId: string) {
    return this.prisma.taskType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  // 2. Task Statuses CRUD
  async createStatus(data: Prisma.TaskStatusCreateInput) {
    return this.prisma.taskStatus.create({ data });
  }

  async findStatuses() {
    return this.prisma.taskStatus.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findStatusById(id: string) {
    return this.prisma.taskStatus.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findStatusByCode(code: string) {
    return this.prisma.taskStatus.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async updateStatus(id: string, data: Prisma.TaskStatusUpdateInput) {
    return this.prisma.taskStatus.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async deleteStatus(id: string, userId: string) {
    return this.prisma.taskStatus.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  // 3. Task Priorities CRUD
  async createPriority(data: Prisma.TaskPriorityCreateInput) {
    return this.prisma.taskPriority.create({ data });
  }

  async findPriorities() {
    return this.prisma.taskPriority.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findPriorityById(id: string) {
    return this.prisma.taskPriority.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findPriorityByCode(code: string) {
    return this.prisma.taskPriority.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async updatePriority(id: string, data: Prisma.TaskPriorityUpdateInput) {
    return this.prisma.taskPriority.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async deletePriority(id: string, userId: string) {
    return this.prisma.taskPriority.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  // 4. Task Labels CRUD
  async createLabel(data: Prisma.TaskLabelCreateInput) {
    return this.prisma.taskLabel.create({ data });
  }

  async findLabels() {
    return this.prisma.taskLabel.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findLabelById(id: string) {
    return this.prisma.taskLabel.findUnique({
      where: { id },
    });
  }

  async deleteLabel(id: string) {
    return this.prisma.taskLabel.delete({
      where: { id },
    });
  }
}
