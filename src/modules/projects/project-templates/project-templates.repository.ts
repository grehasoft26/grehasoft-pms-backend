import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectTemplatesRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectTemplateCreateInput) {
    return this.prisma.projectTemplate.create({ data });
  }

  async findMany() {
    return this.prisma.projectTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.projectTemplate.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByName(name: string) {
    return this.prisma.projectTemplate.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.ProjectTemplateUpdateInput) {
    return this.prisma.projectTemplate.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.projectTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
