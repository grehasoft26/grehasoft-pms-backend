import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateClientTagDto } from './dto/client-tags.dto';

@Injectable()
export class ClientTagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientTagDto) {
    return this.prisma.clientTag.create({
      data: dto,
    });
  }

  async findMany() {
    return this.prisma.clientTag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.clientTag.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return this.prisma.clientTag.findUnique({
      where: { name },
    });
  }
}
