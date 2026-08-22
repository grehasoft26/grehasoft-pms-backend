import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkforceService } from '../workforce/services/workforce.service';
import {
  CreateSEOTaskDto,
  UpdateSEOTaskDto,
  ReviewSEOTaskDto,
} from '../workforce/dto/workforce.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('SEO Tasks')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/tasks')
export class TasksController {
  constructor(private readonly service: WorkforceService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post()
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Create campaign task and assign to executive' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateSEOTaskDto, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const user = (req as any).user;
    const data = await this.service.createTask(
      tenantId,
      user?.id || 'system',
      dto,
    );
    return { message: 'SEO Task created successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get list of campaign tasks' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(
    @Req() req: Request,
    @Query('assignedExecutiveId') assignedExecutiveId?: string,
    @Query('seoProjectId') seoProjectId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getTasks(tenantId, {
      assignedExecutiveId,
      seoProjectId,
      status,
    });
    return { message: 'SEO Tasks retrieved', data };
  }

  @Get(':id')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get campaign task details with history log' })
  @ApiResponse({ type: SuccessResponseDto })
  async getOne(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getTask(tenantId, id);
    return { message: 'SEO Task detail retrieved', data };
  }

  @Patch(':id')
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Update SEO task details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSEOTaskDto,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const user = (req as any).user;
    const userName = user ? `${user.firstName} ${user.lastName}` : 'system';
    const data = await this.service.updateTask(
      tenantId,
      user?.id || 'system',
      userName,
      id,
      dto,
    );
    return { message: 'SEO Task updated successfully', data };
  }

  @Post(':id/review')
  @Permissions('seo.review')
  @ApiOperation({ summary: 'Submit manager review comments and status' })
  @ApiResponse({ type: SuccessResponseDto })
  async review(
    @Param('id') id: string,
    @Body() dto: ReviewSEOTaskDto,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const user = (req as any).user;
    const userName = user ? `${user.firstName} ${user.lastName}` : 'system';
    const data = await this.service.reviewTask(
      tenantId,
      user?.id || 'system',
      userName,
      id,
      dto,
    );
    return { message: 'SEO Task review logged successfully', data };
  }
}
