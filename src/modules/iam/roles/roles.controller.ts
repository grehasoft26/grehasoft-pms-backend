import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from './dto/roles.dto';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  private getContext(req: Request): RequestContext {
    return {
      userId: (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user role with hierarchy support' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateRoleDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.rolesService.create(dto, context);
    return { message: 'Role created successfully', data };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all roles with hierarchy details and assigned permissions',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.rolesService.getMany();
    return { message: 'Roles retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific role by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.rolesService.getById(id);
    return { message: 'Role retrieved successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.rolesService.update(id, dto, context);
    return { message: 'Role updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a role' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.rolesService.delete(id, context);
    return { message: 'Role soft-deleted successfully' };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted role' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.rolesService.restore(id, context);
    return { message: 'Role restored successfully', data };
  }

  @Post(':id/clone')
  @ApiOperation({
    summary: 'Clone a role and copy all of its assigned permissions',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async clone(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.rolesService.clone(id, context);
    return { message: 'Role cloned successfully', data };
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Assign a list of permissions to a role' })
  @ApiResponse({ type: SuccessResponseDto })
  async assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.rolesService.assignPermissions(
      id,
      dto.permissionIds,
      context,
    );
    return { message: 'Permissions assigned to role successfully', data };
  }
}
