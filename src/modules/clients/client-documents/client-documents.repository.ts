import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { DocumentCategory } from '@prisma/client';

@Injectable()
export class ClientDocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clientId: string;
    fileName: string;
    fileKey: string;
    mimeType?: string;
    fileSize?: number;
    documentVersion?: string;
    category: DocumentCategory;
    expiryDate?: Date;
    reminderDate?: Date;
    uploadedBy: string;
    createdBy?: string;
  }) {
    return this.prisma.clientDocument.create({
      data,
    });
  }

  async findMany(clientId?: string) {
    const where: any = { deletedAt: null };
    if (clientId) where.clientId = clientId;
    return this.prisma.clientDocument.findMany({
      where,
      orderBy: { uploadDate: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.clientDocument.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.clientDocument.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.clientDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }
}
