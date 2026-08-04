import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userData: any, preferenceData: any = {}) {
    return this.prisma.user.create({
      data: {
        ...userData,
        preferences: {
          create: preferenceData,
        },
      },
      include: {
        role: true,
        department: true,
        designation: true,
        preferences: true,
      },
    });
  }

  async findMany() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        role: true,
        department: true,
        designation: true,
        preferences: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        role: true,
        department: true,
        designation: true,
        preferences: true,
        teams: {
          include: { team: true },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async update(id: string, userData: any, preferenceData?: any) {
    const updatePayload: any = { ...userData };
    
    if (preferenceData) {
      updatePayload.preferences = {
        upsert: {
          create: preferenceData,
          update: preferenceData,
        },
      };
    }

    return this.prisma.user.update({
      where: { id },
      data: updatePayload,
      include: {
        role: true,
        department: true,
        designation: true,
        preferences: true,
      },
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
}
