import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Groups ---
  async createGroup(data: any) {
    return this.prisma.permissionGroup.create({ data });
  }

  async findGroups() {
    return this.prisma.permissionGroup.findMany({
      where: { deletedAt: null },
      include: {
        categories: {
          where: { deletedAt: null },
          include: {
            permissions: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  async findGroupById(id: string) {
    return this.prisma.permissionGroup.findFirst({
      where: { id, deletedAt: null },
    });
  }

  // --- Categories ---
  async createCategory(data: any) {
    return this.prisma.permissionCategory.create({ data });
  }

  async findCategories() {
    return this.prisma.permissionCategory.findMany({
      where: { deletedAt: null },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async findCategoryById(id: string) {
    return this.prisma.permissionCategory.findFirst({
      where: { id, deletedAt: null },
    });
  }

  // --- Permissions ---
  async createPermission(data: any) {
    return this.prisma.permission.create({ data });
  }

  async findPermissions() {
    return this.prisma.permission.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
      },
    });
  }

  async findPermissionById(id: string) {
    return this.prisma.permission.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findPermissionByCode(code: string) {
    return this.prisma.permission.findFirst({
      where: { code, deletedAt: null },
    });
  }
}
