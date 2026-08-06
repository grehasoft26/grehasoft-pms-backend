import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateClientContractDto, UpdateClientContractDto } from './dto/client-contracts.dto';

@Injectable()
export class ClientContractsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientContractDto & { createdBy?: string }) {
    const { startDate, endDate, renewalDate, ...contractData } = dto;
    return this.prisma.clientContract.create({
      data: {
        ...contractData,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        renewalDate: renewalDate ? new Date(renewalDate) : null,
      },
    });
  }

  async findMany(clientId?: string) {
    const where: any = { deletedAt: null };
    if (clientId) where.clientId = clientId;
    return this.prisma.clientContract.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.clientContract.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByContractNumber(contractNumber: string) {
    return this.prisma.clientContract.findFirst({
      where: { contractNumber, deletedAt: null },
    });
  }

  async update(id: string, dto: UpdateClientContractDto & { updatedBy?: string }) {
    const { startDate, endDate, renewalDate, ...contractData } = dto;
    const updateData: any = {
      ...contractData,
      version: { increment: 1 },
    };
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (renewalDate !== undefined) updateData.renewalDate = renewalDate ? new Date(renewalDate) : null;

    return this.prisma.clientContract.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.clientContract.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }
}
