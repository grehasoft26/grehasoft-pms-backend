import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  CreateClientNoteDto,
  UpdateClientNoteDto,
} from './dto/client-notes.dto';

@Injectable()
export class ClientNotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientNoteDto & { createdBy: string }) {
    const { mentions, attachmentsReference, ...noteData } = dto;
    return this.prisma.clientNote.create({
      data: {
        ...noteData,
        mentions: mentions ? mentions : undefined,
        attachmentsReference: attachmentsReference
          ? attachmentsReference
          : undefined,
      },
    });
  }

  async findMany(clientId?: string) {
    const where: any = { deletedAt: null };
    if (clientId) where.clientId = clientId;
    return this.prisma.clientNote.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.clientNote.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, dto: UpdateClientNoteDto & { updatedBy?: string }) {
    const { mentions, attachmentsReference, ...noteData } = dto;
    const updateData: any = {
      ...noteData,
      version: { increment: 1 },
    };
    if (mentions) updateData.mentions = mentions;
    if (attachmentsReference)
      updateData.attachmentsReference = attachmentsReference;

    return this.prisma.clientNote.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.clientNote.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }
}
