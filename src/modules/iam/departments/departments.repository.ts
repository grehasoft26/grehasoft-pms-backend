import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.department.create({
      data,
      include: {
        parent: true,
        manager: true,
        deputyManager: true,
      },
    });
  }

  async findMany() {
    return this.prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        parent: true,
        manager: true,
        deputyManager: true,
        children: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        manager: true,
        deputyManager: true,
        children: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.department.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async findByCode(code: string) {
    return this.prisma.department.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.department.update({
      where: { id },
      data,
      include: {
        parent: true,
        manager: true,
        deputyManager: true,
      },
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.department.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.department.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
}
