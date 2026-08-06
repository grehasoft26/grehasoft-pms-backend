import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class ClientTimelinesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clientId: string;
    event: string;
    description: string;
    metadata?: any;
    createdBy?: string;
  }) {
    return this.prisma.clientTimeline.create({
      data: {
        clientId: data.clientId,
        event: data.event,
        description: data.description,
        metadata: data.metadata || undefined,
        createdBy: data.createdBy,
      },
    });
  }

  async findMany(clientId: string) {
    return this.prisma.clientTimeline.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
