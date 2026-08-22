import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientFilterDto,
} from './dto/clients.dto';
import { ClientStatus } from '@prisma/client';

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async generateClientCode(): Promise<string> {
    const lastClient = await this.prisma.client.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let lastNum = 0;
    if (lastClient && lastClient.code) {
      const match = lastClient.code.match(/CL-(\d+)/);
      if (match) {
        lastNum = parseInt(match[1], 10);
      }
    }
    const nextNum = lastNum + 1;
    return `CL-${String(nextNum).padStart(6, '0')}`;
  }

  async create(dto: CreateClientDto & { code: string; createdBy?: string }) {
    const { tags, ...clientData } = dto;
    const tagConnectOrCreate =
      tags && tags.length > 0
        ? {
            connectOrCreate: tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined;

    return this.prisma.client.create({
      data: {
        ...clientData,
        tags: tagConnectOrCreate,
      },
      include: {
        category: true,
        tags: true,
        contacts: true,
        addresses: true,
      },
    });
  }

  async findMany(filters: ClientFilterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      categoryId,
      industry,
      companyType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (industry) {
      where.industry = { contains: industry };
    }
    if (companyType) {
      where.companyType = { contains: companyType };
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { gstVatNumber: { contains: search } },
        { website: { contains: search } },
        {
          contacts: {
            some: {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { mobile: { contains: search } },
                { officePhone: { contains: search } },
              ],
            },
          },
        },
      ];
    }

    // Direct mapping to ensure correct ordering property
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'name',
      'code',
      'status',
    ];
    const orderByField = validSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, totalCount] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        include: {
          category: true,
          tags: true,
          contacts: true,
          addresses: true,
          primaryContact: true,
          primaryAddress: true,
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, totalCount };
  }

  async findById(id: string) {
    return this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        tags: true,
        contacts: true,
        addresses: true,
        primaryContact: true,
        primaryAddress: true,
        documents: true,
        contracts: true,
        notes: true,
        timelines: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async update(id: string, dto: UpdateClientDto & { updatedBy?: string }) {
    const { tags, ...clientData } = dto;
    const dataPayload: any = {
      ...clientData,
      version: { increment: 1 },
    };

    if (tags) {
      dataPayload.tags = {
        set: [], // clear existing tags
        connectOrCreate: tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    return this.prisma.client.update({
      where: { id },
      data: dataPayload,
      include: {
        category: true,
        tags: true,
        contacts: true,
        addresses: true,
        primaryContact: true,
        primaryAddress: true,
      },
    });
  }

  async delete(id: string, deletedBy: string) {
    return this.prisma.client.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.client.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
}
