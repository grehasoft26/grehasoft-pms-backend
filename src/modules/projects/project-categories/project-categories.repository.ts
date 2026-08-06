import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectCategoriesRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectCategoryCreateInput) {
    return this.prisma.projectCategory.create({ data });
  }

  async findMany() {
    return this.prisma.projectCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.projectCategory.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCode(code: string) {
    return this.prisma.projectCategory.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.ProjectCategoryUpdateInput) {
    return this.prisma.projectCategory.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.projectCategory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
