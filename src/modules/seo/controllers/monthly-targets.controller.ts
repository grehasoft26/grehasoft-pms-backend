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
  CreateSEOMonthlyTargetDto,
  UpdateSEOMonthlyTargetDto,
} from '../workforce/dto/workforce.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('SEO Monthly Targets')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/monthly-targets')
export class MonthlyTargetsController {
  constructor(private readonly service: WorkforceService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post()
  @Permissions('seo.targets.manage')
  @ApiOperation({ summary: 'Create monthly target for executive' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateSEOMonthlyTargetDto, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.createTarget(tenantId, dto);
    return { message: 'Monthly target set successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get list of monthly targets' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(
    @Req() req: Request,
    @Query('executiveId') executiveId?: string,
    @Query('seoProjectId') seoProjectId?: string,
    @Query('month') month?: string,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getTargets(tenantId, {
      executiveId,
      seoProjectId,
      month,
    });
    return { message: 'Monthly targets retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('seo.targets.manage')
  @ApiOperation({ summary: 'Update target count' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSEOMonthlyTargetDto,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.updateTarget(tenantId, id, dto);
    return { message: 'Monthly target updated successfully', data };
  }
}
