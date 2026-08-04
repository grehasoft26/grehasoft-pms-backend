import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly repository: RolesRepository,
    private readonly logger: LoggerService
  ) {}

  private async checkRoleHierarchyCycle(roleId: string, parentId: string): Promise<boolean> {
    if (roleId === parentId) return true;
    let parent = await this.repository.findById(parentId);
    while (parent && parent.parentId) {
      if (parent.parentId === roleId) return true;
      parent = await this.repository.findById(parent.parentId);
    }
    return false;
  }

  async create(dto: CreateRoleDto, context: RequestContext) {
    const exists = await this.repository.findByName(dto.name);
    if (exists) {
      throw new ConflictException(`Role with name "${dto.name}" already exists`);
    }

    if (dto.parentId) {
      const parentExists = await this.repository.findById(dto.parentId);
      if (!parentExists) {
        throw new NotFoundException('Parent role not found');
      }
    }

    const data = {
      ...dto,
      createdBy: context.userId,
    };

    const role = await this.repository.create(data);
    this.logger.audit(context.userId, 'Create Role', 'role', role, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: role,
    });
    return role;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const role = await this.repository.findById(id);
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto, context: RequestContext) {
    const role = await this.getById(id);

    if (dto.name && dto.name !== role.name) {
      const exists = await this.repository.findByName(dto.name);
      if (exists) {
        throw new ConflictException(`Role with name "${dto.name}" already exists`);
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A role cannot be its own parent');
      }
      const parentExists = await this.repository.findById(dto.parentId);
      if (!parentExists) {
        throw new NotFoundException('Parent role not found');
      }
      const isCycle = await this.checkRoleHierarchyCycle(id, dto.parentId);
      if (isCycle) {
        throw new BadRequestException('Circular dependency detected in role hierarchy');
      }
    }

    const updateData = {
      ...dto,
      updatedBy: context.userId,
      version: { increment: 1 },
    };

    const updatedRole = await this.repository.update(id, updateData);
    
    this.logger.audit(context.userId, 'Update Role', 'role', updatedRole, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: role,
      after: updatedRole,
    });
    return updatedRole;
  }

  async delete(id: string, context: RequestContext) {
    const role = await this.getById(id);
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    await this.repository.delete(id, context.userId);
    this.logger.audit(context.userId, 'Delete Role', 'role', { id }, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: role,
    });
  }

  async restore(id: string, context: RequestContext) {
    const role = await this.repository.findById(id);
    // Explicitly bypass default filter to find soft-deleted role if needed
    const restoredRole = await this.repository.restore(id);
    this.logger.audit(context.userId, 'Restore Role', 'role', restoredRole, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: restoredRole,
    });
    return restoredRole;
  }

  async clone(id: string, context: RequestContext) {
    const sourceRole = await this.getById(id);
    
    const cloneData: CreateRoleDto = {
      name: `${sourceRole.name} - Clone (${Date.now()})`,
      description: sourceRole.description || undefined,
      parentId: sourceRole.parentId || undefined,
      isSystem: false,
    };

    const cloned = await this.create(cloneData, context);
    
    // Copy permissions
    if (sourceRole.permissions && sourceRole.permissions.length > 0) {
      const permissionIds = sourceRole.permissions.map((p) => p.id);
      await this.repository.assignPermissions(cloned.id, permissionIds);
    }

    const finalRole = await this.getById(cloned.id);
    
    this.logger.audit(context.userId, 'Clone Role', 'role', finalRole, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: sourceRole,
      after: finalRole,
    });
    return finalRole;
  }

  async assignPermissions(id: string, permissionIds: string[], context: RequestContext) {
    const role = await this.getById(id);
    const updated = await this.repository.assignPermissions(id, permissionIds);
    
    this.logger.audit(context.userId, 'Assign Role Permissions', 'role', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: role,
      after: updated,
    });
    return updated;
  }
}
