import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class TeamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.team.create({
      data,
      include: { lead: true },
    });
  }

  async findMany() {
    return this.prisma.team.findMany({
      where: { deletedAt: null },
      include: {
        lead: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.team.findFirst({
      where: { id, deletedAt: null },
      include: {
        lead: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.team.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async findByCode(code: string) {
    return this.prisma.team.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.team.update({
      where: { id },
      data,
      include: { lead: true },
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.team.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.team.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async assignMembers(
    teamId: string,
    members: { userId: string; roleInTeam?: string }[],
  ) {
    // Delete existing links first in a transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.userTeam.deleteMany({
        where: { teamId },
      });

      if (members.length > 0) {
        await tx.userTeam.createMany({
          data: members.map((m) => ({
            teamId,
            userId: m.userId,
            roleInTeam: m.roleInTeam || 'member',
          })),
        });
      }

      return tx.team.findFirst({
        where: { id: teamId },
        include: {
          members: {
            include: { user: true },
          },
        },
      });
    });
  }
}
