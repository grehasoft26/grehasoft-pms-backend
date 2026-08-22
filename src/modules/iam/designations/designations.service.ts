import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DesignationsRepository } from './designations.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/designations.dto';
import { Status } from '@prisma/client';

@Injectable()
export class DesignationsService {
  constructor(
    private readonly repository: DesignationsRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateDesignationDto, context: RequestContext) {
    const nameExists = await this.repository.findByName(dto.name);
    if (nameExists) {
      throw new ConflictException(
        `Designation with name "${dto.name}" already exists`,
      );
    }

    const codeExists = await this.repository.findByCode(dto.code);
    if (codeExists) {
      throw new ConflictException(
        `Designation with code "${dto.code}" already exists`,
      );
    }

    const data = {
      ...dto,
      createdBy: context.userId,
    };

    const designation = await this.repository.create(data);
    this.logger.audit(
      context.userId,
      'Create Designation',
      'designation',
      designation,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: designation,
      },
    );
    return designation;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const designation = await this.repository.findById(id);
    if (!designation) throw new NotFoundException('Designation not found');
    return designation;
  }

  async update(id: string, dto: UpdateDesignationDto, context: RequestContext) {
    const designation = await this.getById(id);

    if (dto.name && dto.name !== designation.name) {
      const exists = await this.repository.findByName(dto.name);
      if (exists) {
        throw new ConflictException(
          `Designation with name "${dto.name}" already exists`,
        );
      }
    }

    if (dto.code && dto.code !== designation.code) {
      const exists = await this.repository.findByCode(dto.code);
      if (exists) {
        throw new ConflictException(
          `Designation with code "${dto.code}" already exists`,
        );
      }
    }

    const updateData = {
      ...dto,
      updatedBy: context.userId,
      version: { increment: 1 },
    };

    const updated = await this.repository.update(id, updateData);

    this.logger.audit(
      context.userId,
      'Update Designation',
      'designation',
      updated,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before: designation,
        after: updated,
      },
    );
    return updated;
  }

  async delete(id: string, context: RequestContext) {
    const designation = await this.getById(id);
    await this.repository.delete(id, context.userId);
    this.logger.audit(
      context.userId,
      'Delete Designation',
      'designation',
      { id },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before: designation,
      },
    );
  }

  async restore(id: string, context: RequestContext) {
    const restored = await this.repository.restore(id);
    this.logger.audit(
      context.userId,
      'Restore Designation',
      'designation',
      restored,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: restored,
      },
    );
    return restored;
  }

  async setStatus(id: string, status: Status, context: RequestContext) {
    const designation = await this.getById(id);
    const updated = await this.repository.update(id, {
      status,
      updatedBy: context.userId,
      version: { increment: 1 },
    });

    this.logger.audit(
      context.userId,
      `${status === Status.ACTIVE ? 'Activate' : 'Deactivate'} Designation`,
      'designation',
      updated,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before: designation,
        after: updated,
      },
    );
    return updated;
  }
}
