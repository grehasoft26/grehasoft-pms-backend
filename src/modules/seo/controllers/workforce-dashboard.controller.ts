import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkforceDashboardService } from '../workforce/services/workforce-dashboard.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('SEO Workforce Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo')
export class WorkforceDashboardController {
  constructor(private readonly service: WorkforceDashboardService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Get('executive/dashboard')
  @Permissions('seo.read')
  @ApiOperation({
    summary: 'Get current executive personal SEO statistics dashboard',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getExecutive(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const user = (req as any).user;
    const data = await this.service.getExecutiveDashboard(
      tenantId,
      user?.id || 'system',
    );
    return {
      message: 'Executive dashboard details retrieved successfully',
      data,
    };
  }

  @Get('manager/dashboard')
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Get manager SEO team statistics dashboard' })
  @ApiResponse({ type: SuccessResponseDto })
  async getManager(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getManagerDashboard(tenantId);
    return {
      message: 'Manager dashboard details retrieved successfully',
      data,
    };
  }
}
