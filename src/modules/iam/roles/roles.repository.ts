import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.role.create({
      data,
      include: { parent: true },
    });
  }

  async findMany() {
    return this.prisma.role.findMany({
      where: { deletedAt: null },
      include: {
        parent: true,
        permissions: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        permissions: true,
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.role.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.role.update({
      where: { id },
      data,
      include: { parent: true, permissions: true },
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async assignPermissions(id: string, permissionIds: string[]) {
    return this.prisma.role.update({
      where: { id },
      data: {
        permissions: {
          set: permissionIds.map((pid) => ({ id: pid })),
        },
      },
      include: { permissions: true },
    });
  }
}
