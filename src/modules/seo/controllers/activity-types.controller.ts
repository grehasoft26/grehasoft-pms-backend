import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  CreateSEOActivityTypeDto,
  UpdateSEOActivityTypeDto,
} from '../workforce/dto/workforce.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('SEO Activity Types')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/activity-types')
export class ActivityTypesController {
  constructor(private readonly service: WorkforceService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post()
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Create a new SEO activity type' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateSEOActivityTypeDto, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.createActivityType(tenantId, dto);
    return { message: 'SEO Activity Type created successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get list of SEO activity types' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getActivityTypes(tenantId);
    return { message: 'SEO Activity Types list retrieved', data };
  }

  @Get(':id')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get details of an SEO activity type' })
  @ApiResponse({ type: SuccessResponseDto })
  async getOne(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getActivityType(tenantId, id);
    return { message: 'SEO Activity Type details retrieved', data };
  }

  @Patch(':id')
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Update an SEO activity type' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSEOActivityTypeDto,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.updateActivityType(tenantId, id, dto);
    return { message: 'SEO Activity Type updated successfully', data };
  }

  @Delete(':id')
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Delete/Deactivate an SEO activity type' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    await this.service.deleteActivityType(tenantId, id);
    return { message: 'SEO Activity Type deleted successfully' };
  }
}
