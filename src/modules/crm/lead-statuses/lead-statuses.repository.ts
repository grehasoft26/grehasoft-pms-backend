import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadStatusesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LeadStatusCreateInput) {
    return this.prisma.leadStatus.create({ data });
  }

  async findMany() {
    return this.prisma.leadStatus.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.leadStatus.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCode(code: string) {
    return this.prisma.leadStatus.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.LeadStatusUpdateInput) {
    return this.prisma.leadStatus.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.leadStatus.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
