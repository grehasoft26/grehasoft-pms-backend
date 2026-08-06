import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LeadSourcesRepository } from './lead-sources.repository';
import { CreateLeadSourceDto, UpdateLeadSourceDto } from './dto/lead-sources.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class LeadSourcesService {
  constructor(
    private readonly repository: LeadSourcesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateLeadSourceDto, context: RequestContext) {
    const existing = await this.repository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Lead source with code ${dto.code} already exists`);
    }

    const source = await this.repository.create({
      ...dto,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Create Lead Source', 'leadSource', source, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: source,
    });

    return source;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const source = await this.repository.findById(id);
    if (!source) {
      throw new NotFoundException(`Lead source with ID ${id} not found`);
    }
    return source;
  }

  async update(id: string, dto: UpdateLeadSourceDto, context: RequestContext) {
    const before = await this.getById(id);
    if (before.isSystem) {
      throw new BadRequestException('System lead sources cannot be modified');
    }

    if (dto.code && dto.code !== before.code) {
      const existing = await this.repository.findByCode(dto.code);
      if (existing) {
        throw new ConflictException(`Lead source with code ${dto.code} already exists`);
      }
    }

    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    this.logger.audit(context.userId, 'Update Lead Source', 'leadSource', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
      after: updated,
    });

    return updated;
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    if (before.isSystem) {
      throw new BadRequestException('System lead sources cannot be deleted');
    }

    await this.repository.delete(id, context.userId);

    this.logger.audit(context.userId, 'Delete Lead Source', 'leadSource', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }
}
