import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateClientCategoryDto, UpdateClientCategoryDto } from './dto/client-categories.dto';

@Injectable()
export class ClientCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientCategoryDto & { createdBy?: string }) {
    return this.prisma.clientCategory.create({
      data: dto,
    });
  }

  async findMany() {
    return this.prisma.clientCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.clientCategory.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCode(code: string) {
    return this.prisma.clientCategory.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async update(id: string, dto: UpdateClientCategoryDto & { updatedBy?: string }) {
    return this.prisma.clientCategory.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.clientCategory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }
}
