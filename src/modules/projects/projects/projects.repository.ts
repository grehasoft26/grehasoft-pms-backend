import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { ProjectFilterDto } from './dto/projects.dto';
import { Prisma, ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectUncheckedCreateInput) {
    return this.prisma.project.create({
      data,
      include: {
        category: true,
        client: true,
        proposal: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        tags: true,
      },
    });
  }

  async findMany(filters: ProjectFilterDto) {
    const where: Prisma.ProjectWhereInput = {};

    if (filters.isDeleted === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { code: { contains: filters.search } },
      ];
    }

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.type) where.type = filters.type;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.managerId) where.managerId = filters.managerId;

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          client: true,
          proposal: true,
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          tags: true,
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, totalCount };
  }

  async findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        category: true,
        client: true,
        proposal: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        tags: true,
        phases: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        milestones: {
          where: { deletedAt: null },
          orderBy: { dueDate: 'asc' },
          include: {
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        resources: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        risks: {
          where: { deletedAt: null },
          include: {
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        issues: {
          where: { deletedAt: null },
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        documents: {
          where: { deletedAt: null },
        },
        timelines: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.project.findUnique({
      where: { code },
    });
  }

  async update(id: string, data: Prisma.ProjectUncheckedUpdateInput) {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        category: true,
        client: true,
        proposal: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        tags: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async permanentDelete(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async generateProjectCode() {
    const currentYear = new Date().getFullYear();
    const prefix = `PRJ-${currentYear}-`;

    const lastProject = await this.prisma.project.findFirst({
      where: {
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: 'desc',
      },
      select: {
        code: true,
      },
    });

    let sequence = 1;
    if (lastProject && lastProject.code) {
      const parts = lastProject.code.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
    }

    return `${prefix}${String(sequence).padStart(6, '0')}`;
  }

  // Tags Helper
  async syncTags(projectId: string, tagsList: string[]) {
    if (!tagsList) return;

    // Disconnect all existing tags first
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        tags: {
          set: [],
        },
      },
    });

    // Create or connect new tags
    for (const tagName of tagsList) {
      const tag = await this.prisma.projectTag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });

      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          tags: {
            connect: { id: tag.id },
          },
        },
      });
    }
  }

  // Timeline operations
  async createTimeline(data: Prisma.ProjectTimelineUncheckedCreateInput) {
    return this.prisma.projectTimeline.create({ data });
  }

  async getTimeline(projectId: string) {
    return this.prisma.projectTimeline.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
