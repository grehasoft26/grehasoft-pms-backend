import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectRisksRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectRiskUncheckedCreateInput) {
    return this.prisma.projectRisk.create({
      data,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findMany(projectId: string) {
    return this.prisma.projectRisk.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { riskScore: 'desc' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.projectRisk.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: Prisma.ProjectRiskUncheckedUpdateInput) {
    return this.prisma.projectRisk.update({
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
    return this.prisma.projectRisk.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
