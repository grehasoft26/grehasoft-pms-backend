import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectDocumentsRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectDocumentUncheckedCreateInput) {
    return this.prisma.projectDocument.create({
      data,
    });
  }

  async findMany(projectId: string) {
    return this.prisma.projectDocument.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { uploadDate: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.projectDocument.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.projectDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
