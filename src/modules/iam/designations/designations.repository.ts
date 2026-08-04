import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class DesignationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.designation.create({
      data,
      include: { department: true },
    });
  }

  async findMany() {
    return this.prisma.designation.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { department: true },
    });
  }

  async findById(id: string) {
    return this.prisma.designation.findFirst({
      where: { id, deletedAt: null },
      include: { department: true },
    });
  }

  async findByName(name: string) {
    return this.prisma.designation.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async findByCode(code: string) {
    return this.prisma.designation.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.designation.update({
      where: { id },
      data,
      include: { department: true },
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.designation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.designation.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
}
