import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectMembersRepository {
  constructor(public readonly prisma: PrismaService) {}

  async assign(data: Prisma.ProjectMemberUncheckedCreateInput) {
    return this.prisma.projectMember.upsert({
      where: {
        projectId_userId_role: {
          projectId: data.projectId,
          userId: data.userId,
          role: data.role,
        },
      },
      update: {
        role: data.role,
      },
      create: data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findMany(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.projectMember.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findAssignment(projectId: string, userId: string, role: string) {
    return this.prisma.projectMember.findUnique({
      where: {
        projectId_userId_role: {
          projectId,
          userId,
          role,
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.projectMember.delete({
      where: { id },
    });
  }

  async removeAll(projectId: string) {
    return this.prisma.projectMember.deleteMany({
      where: { projectId },
    });
  }
}
