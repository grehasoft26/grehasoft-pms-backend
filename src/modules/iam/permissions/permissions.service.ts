import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import {
  CreatePermissionGroupDto,
  CreatePermissionCategoryDto,
  CreatePermissionDto,
} from './dto/permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly repository: PermissionsRepository,
    private readonly logger: LoggerService,
  ) {}

  // --- Groups ---
  async createGroup(dto: CreatePermissionGroupDto, context: RequestContext) {
    const group = await this.repository.createGroup(dto);
    this.logger.audit(
      context.userId,
      'Create Permission Group',
      'permission_group',
      group,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: group,
      },
    );
    return group;
  }

  async getGroups() {
    return this.repository.findGroups();
  }

  // --- Categories ---
  async createCategory(
    dto: CreatePermissionCategoryDto,
    context: RequestContext,
  ) {
    const groupExists = await this.repository.findGroupById(dto.groupId);
    if (!groupExists) {
      throw new NotFoundException('Permission Group not found');
    }
    const category = await this.repository.createCategory(dto);
    this.logger.audit(
      context.userId,
      'Create Permission Category',
      'permission_category',
      category,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: category,
      },
    );
    return category;
  }

  async getCategories() {
    return this.repository.findCategories();
  }

  // --- Permissions ---
  async createPermission(dto: CreatePermissionDto, context: RequestContext) {
    const categoryExists = await this.repository.findCategoryById(
      dto.categoryId,
    );
    if (!categoryExists) {
      throw new NotFoundException('Permission Category not found');
    }
    const permissionExists = await this.repository.findPermissionByCode(
      dto.code,
    );
    if (permissionExists) {
      throw new ConflictException(
        `Permission code "${dto.code}" already exists`,
      );
    }
    const permission = await this.repository.createPermission(dto);
    this.logger.audit(
      context.userId,
      'Create Permission',
      'permission',
      permission,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: permission,
      },
    );
    return permission;
  }

  async getPermissions() {
    return this.repository.findPermissions();
  }
}
