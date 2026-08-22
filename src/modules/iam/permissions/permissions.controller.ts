import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import {
  CreatePermissionGroupDto,
  CreatePermissionCategoryDto,
  CreatePermissionDto,
} from './dto/permissions.dto';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  private getContext(req: Request): RequestContext {
    return {
      userId: (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  // --- Groups ---
  @Post('groups')
  @ApiOperation({ summary: 'Create a new permission group (e.g., CRM)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createGroup(
    @Body() dto: CreatePermissionGroupDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.permissionsService.createGroup(dto, context);
    return { message: 'Permission group created successfully', data };
  }

  @Get('groups')
  @ApiOperation({
    summary: 'Get all permission groups with categories and permissions',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getGroups() {
    const data = await this.permissionsService.getGroups();
    return { message: 'Permission groups retrieved successfully', data };
  }

  // --- Categories ---
  @Post('categories')
  @ApiOperation({ summary: 'Create a new permission category' })
  @ApiResponse({ type: SuccessResponseDto })
  async createCategory(
    @Body() dto: CreatePermissionCategoryDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.permissionsService.createCategory(dto, context);
    return { message: 'Permission category created successfully', data };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all permission categories' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCategories() {
    const data = await this.permissionsService.getCategories();
    return { message: 'Permission categories retrieved successfully', data };
  }

  // --- Permissions ---
  @Post()
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ type: SuccessResponseDto })
  async createPermission(
    @Body() dto: CreatePermissionDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.permissionsService.createPermission(dto, context);
    return { message: 'Permission created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions list' })
  @ApiResponse({ type: SuccessResponseDto })
  async getPermissions() {
    const data = await this.permissionsService.getPermissions();
    return { message: 'Permissions retrieved successfully', data };
  }
}
