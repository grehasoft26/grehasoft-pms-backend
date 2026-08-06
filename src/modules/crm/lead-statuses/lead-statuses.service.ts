import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LeadStatusesRepository } from './lead-statuses.repository';
import { CreateLeadStatusDto, UpdateLeadStatusDto } from './dto/lead-statuses.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class LeadStatusesService {
  constructor(
    private readonly repository: LeadStatusesRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateLeadStatusDto, context: RequestContext) {
    const existing = await this.repository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Lead status with code ${dto.code} already exists`);
    }

    const status = await this.repository.create({
      ...dto,
      createdBy: context.userId,
    });

    this.logger.audit(context.userId, 'Create Lead Status', 'leadStatus', status, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: status,
    });

    return status;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const status = await this.repository.findById(id);
    if (!status) {
      throw new NotFoundException(`Lead status with ID ${id} not found`);
    }
    return status;
  }

  async update(id: string, dto: UpdateLeadStatusDto, context: RequestContext) {
    const before = await this.getById(id);
    if (before.isSystem) {
      throw new BadRequestException('System lead statuses cannot be modified');
    }

    if (dto.code && dto.code !== before.code) {
      const existing = await this.repository.findByCode(dto.code);
      if (existing) {
        throw new ConflictException(`Lead status with code ${dto.code} already exists`);
      }
    }

    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: context.userId,
    });

    this.logger.audit(context.userId, 'Update Lead Status', 'leadStatus', updated, {
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
      throw new BadRequestException('System lead statuses cannot be deleted');
    }

    await this.repository.delete(id, context.userId);

    this.logger.audit(context.userId, 'Delete Lead Status', 'leadStatus', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before,
    });
  }
}
