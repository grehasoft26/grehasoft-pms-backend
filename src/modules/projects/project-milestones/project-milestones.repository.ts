import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, DependencyType } from '@prisma/client';

@Injectable()
export class ProjectMilestonesRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectMilestoneUncheckedCreateInput) {
    return this.prisma.projectMilestone.create({
      data,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findMany(projectId: string) {
    return this.prisma.projectMilestone.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { dueDate: 'asc' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        dependencies: {
          include: {
            dependsOnMilestone: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.projectMilestone.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        dependencies: {
          include: {
            dependsOnMilestone: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ProjectMilestoneUncheckedUpdateInput) {
    return this.prisma.projectMilestone.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.projectMilestone.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  // Milestone scheduling dependencies
  async clearDependencies(milestoneId: string) {
    return this.prisma.projectDependency.deleteMany({
      where: { milestoneId },
    });
  }

  async addDependency(milestoneId: string, dependsOnMilestoneId: string, type: DependencyType = DependencyType.FS) {
    return this.prisma.projectDependency.create({
      data: {
        milestoneId,
        dependsOnMilestoneId,
        type,
      },
    });
  }

  async getDependencies(milestoneId: string) {
    return this.prisma.projectDependency.findMany({
      where: { milestoneId },
      include: {
        dependsOnMilestone: true,
      },
    });
  }

  async getDirectDependentMilestones(milestoneId: string) {
    return this.prisma.projectDependency.findMany({
      where: { dependsOnMilestoneId: milestoneId },
      include: {
        milestone: true,
      },
    });
  }
}
