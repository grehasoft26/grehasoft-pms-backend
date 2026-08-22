import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from '../dashboard/dashboard.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Notifications Center')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  private getUserId(req: Request): string {
    const user = (req as any).user;
    return user?.id || (req.headers['x-user-id'] as string) || 'system';
  }

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Get('statistics')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get summary statistics dashboard metrics' })
  @ApiResponse({ type: SuccessResponseDto })
  async getStatistics(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    const data = await this.service.getStatistics(tenantId, userId);
    return {
      message: 'Notifications dashboard statistics retrieved successfully',
      data,
    };
  }
}
