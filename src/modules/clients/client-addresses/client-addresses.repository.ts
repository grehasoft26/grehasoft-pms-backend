import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateClientAddressDto, UpdateClientAddressDto } from './dto/client-addresses.dto';

@Injectable()
export class ClientAddressesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientAddressDto & { createdBy?: string }) {
    return this.prisma.clientAddress.create({
      data: dto,
    });
  }

  async findMany(clientId?: string) {
    const whereClause: any = { deletedAt: null };
    if (clientId) {
      whereClause.clientId = clientId;
    }
    return this.prisma.clientAddress.findMany({
      where: whereClause,
      orderBy: { type: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.clientAddress.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, dto: UpdateClientAddressDto & { updatedBy?: string }) {
    return this.prisma.clientAddress.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.clientAddress.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  async clearPrimaryFlags(clientId: string) {
    return this.prisma.clientAddress.updateMany({
      where: { clientId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  async setClientPrimaryAddress(clientId: string, addressId: string | null) {
    return this.prisma.client.update({
      where: { id: clientId },
      data: { primaryAddressId: addressId },
    });
  }
}
