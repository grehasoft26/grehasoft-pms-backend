import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientTagsRepository } from './client-tags.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateClientTagDto } from './dto/client-tags.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@Injectable()
export class ClientTagsService {
  constructor(
    private readonly repository: ClientTagsRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateClientTagDto, context: RequestContext) {
    const exists = await this.repository.findByName(dto.name);
    if (exists) return exists;

    const tag = await this.repository.create(dto);

    this.logger.audit(context.userId, 'Create Client Tag', 'clientTag', tag, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: tag,
    });

    return tag;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const tag = await this.repository.findById(id);
    if (!tag) throw new NotFoundException('Client tag not found');
    return tag;
  }
}
