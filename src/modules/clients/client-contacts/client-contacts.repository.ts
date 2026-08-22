import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  CreateClientContactDto,
  UpdateClientContactDto,
} from './dto/client-contacts.dto';

@Injectable()
export class ClientContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientContactDto & { createdBy?: string }) {
    const { birthday, ...contactData } = dto;
    return this.prisma.clientContact.create({
      data: {
        ...contactData,
        birthday: birthday ? new Date(birthday) : null,
      },
    });
  }

  async findMany(clientId?: string) {
    const whereClause: any = { deletedAt: null };
    if (clientId) {
      whereClause.clientId = clientId;
    }
    return this.prisma.clientContact.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.clientContact.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(
    id: string,
    dto: UpdateClientContactDto & { updatedBy?: string },
  ) {
    const { birthday, ...contactData } = dto;
    const updateData: any = {
      ...contactData,
      version: { increment: 1 },
    };
    if (birthday !== undefined) {
      updateData.birthday = birthday ? new Date(birthday) : null;
    }
    return this.prisma.clientContact.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.clientContact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  async clearPrimaryFlags(clientId: string) {
    return this.prisma.clientContact.updateMany({
      where: { clientId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  async setClientPrimaryContact(clientId: string, contactId: string | null) {
    return this.prisma.client.update({
      where: { id: clientId },
      data: { primaryContactId: contactId },
    });
  }
}
