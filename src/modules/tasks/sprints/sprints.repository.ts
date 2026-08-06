import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SprintsRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.SprintUncheckedCreateInput) {
    return this.prisma.sprint.create({
      data,
      include: {
        goals: true,
      },
    });
  }

  async findMany(projectId: string) {
    return this.prisma.sprint.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { startDate: 'desc' },
      include: {
        goals: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.sprint.findFirst({
      where: { id, deletedAt: null },
      include: {
        goals: true,
        tasks: {
          where: { deletedAt: null },
          include: {
            type: true,
            status: true,
            priority: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.SprintUncheckedUpdateInput) {
    return this.prisma.sprint.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        goals: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.sprint.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  // Sprint Goals Helpers
  async addGoal(sprintId: string, goal: string) {
    return this.prisma.sprintGoal.create({
      data: {
        sprintId,
        goal,
      },
    });
  }

  async updateGoal(goalId: string, isAchieved: boolean) {
    return this.prisma.sprintGoal.update({
      where: { id: goalId },
      data: {
        isAchieved,
      },
    });
  }

  async removeGoals(sprintId: string) {
    return this.prisma.sprintGoal.deleteMany({
      where: { sprintId },
    });
  }
}
