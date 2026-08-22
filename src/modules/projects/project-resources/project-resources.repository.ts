import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectResourcesRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectResourceUncheckedCreateInput) {
    return this.prisma.projectResource.create({
      data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findMany(projectId: string) {
    return this.prisma.projectResource.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.projectResource.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findUserAllocations(userId: string) {
    return this.prisma.projectResource.findMany({
      where: { userId },
      include: {
        project: true,
      },
    });
  }

  async update(id: string, data: Prisma.ProjectResourceUncheckedUpdateInput) {
    return this.prisma.projectResource.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.projectResource.delete({
      where: { id },
    });
  }

  async removeAll(projectId: string) {
    return this.prisma.projectResource.deleteMany({
      where: { projectId },
    });
  }
}
