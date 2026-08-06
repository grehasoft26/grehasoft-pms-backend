import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadSourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LeadSourceCreateInput) {
    return this.prisma.leadSource.create({ data });
  }

  async findMany() {
    return this.prisma.leadSource.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.leadSource.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCode(code: string) {
    return this.prisma.leadSource.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.LeadSourceUpdateInput) {
    return this.prisma.leadSource.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.leadSource.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
