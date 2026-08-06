import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectIssuesRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectIssueUncheckedCreateInput) {
    return this.prisma.projectIssue.create({
      data,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findMany(projectId: string) {
    return this.prisma.projectIssue.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.projectIssue.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: Prisma.ProjectIssueUncheckedUpdateInput) {
    return this.prisma.projectIssue.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.projectIssue.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
