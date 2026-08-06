import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectPhasesRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectPhaseUncheckedCreateInput) {
    return this.prisma.projectPhase.create({ data });
  }

  async findMany(projectId: string) {
    return this.prisma.projectPhase.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.projectPhase.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCode(projectId: string, code: string) {
    return this.prisma.projectPhase.findFirst({
      where: { projectId, code, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.ProjectPhaseUncheckedUpdateInput) {
    return this.prisma.projectPhase.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.projectPhase.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
