import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/departments.dto';
import { Status } from '@prisma/client';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly repository: DepartmentsRepository,
    private readonly logger: LoggerService
  ) {}

  private async checkDepartmentHierarchyCycle(deptId: string, parentId: string): Promise<boolean> {
    if (deptId === parentId) return true;
    let parent = await this.repository.findById(parentId);
    while (parent && parent.parentId) {
      if (parent.parentId === deptId) return true;
      parent = await this.repository.findById(parent.parentId);
    }
    return false;
  }

  async create(dto: CreateDepartmentDto, context: RequestContext) {
    const nameExists = await this.repository.findByName(dto.name);
    if (nameExists) {
      throw new ConflictException(`Department with name "${dto.name}" already exists`);
    }

    const codeExists = await this.repository.findByCode(dto.code);
    if (codeExists) {
      throw new ConflictException(`Department with code "${dto.code}" already exists`);
    }

    if (dto.parentId) {
      const parentExists = await this.repository.findById(dto.parentId);
      if (!parentExists) {
        throw new NotFoundException('Parent department not found');
      }
    }

    const data = {
      ...dto,
      createdBy: context.userId,
    };

    const department = await this.repository.create(data);
    this.logger.audit(context.userId, 'Create Department', 'department', department, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: department,
    });
    return department;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const department = await this.repository.findById(id);
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto, context: RequestContext) {
    const department = await this.getById(id);

    if (dto.name && dto.name !== department.name) {
      const exists = await this.repository.findByName(dto.name);
      if (exists) {
        throw new ConflictException(`Department with name "${dto.name}" already exists`);
      }
    }

    if (dto.code && dto.code !== department.code) {
      const exists = await this.repository.findByCode(dto.code);
      if (exists) {
        throw new ConflictException(`Department with code "${dto.code}" already exists`);
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A department cannot be its own parent');
      }
      const parentExists = await this.repository.findById(dto.parentId);
      if (!parentExists) {
        throw new NotFoundException('Parent department not found');
      }
      const isCycle = await this.checkDepartmentHierarchyCycle(id, dto.parentId);
      if (isCycle) {
        throw new BadRequestException('Circular dependency detected in department hierarchy');
      }
    }

    const updateData = {
      ...dto,
      updatedBy: context.userId,
      version: { increment: 1 },
    };

    const updatedDepartment = await this.repository.update(id, updateData);
    
    this.logger.audit(context.userId, 'Update Department', 'department', updatedDepartment, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: department,
      after: updatedDepartment,
    });
    return updatedDepartment;
  }

  async delete(id: string, context: RequestContext) {
    const department = await this.getById(id);
    if (department.children && department.children.length > 0) {
      throw new BadRequestException('Departments containing child departments cannot be deleted');
    }
    await this.repository.delete(id, context.userId);
    this.logger.audit(context.userId, 'Delete Department', 'department', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: department,
    });
  }

  async restore(id: string, context: RequestContext) {
    const restored = await this.repository.restore(id);
    this.logger.audit(context.userId, 'Restore Department', 'department', restored, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: restored,
    });
    return restored;
  }

  async setStatus(id: string, status: Status, context: RequestContext) {
    const department = await this.getById(id);
    const updated = await this.repository.update(id, {
      status,
      updatedBy: context.userId,
      version: { increment: 1 },
    });
    
    this.logger.audit(context.userId, `${status === Status.ACTIVE ? 'Activate' : 'Deactivate'} Department`, 'department', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: department,
      after: updated,
    });
    return updated;
  }
}
