import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HrDashboardService } from '../services/dashboard.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('HR Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/dashboard')
export class HrDashboardController {
  constructor(private readonly service: HrDashboardService) {}

  @Get('stats')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get summary metrics: total active employees, present/late headcounts, upcoming anniversaries, pending reviews' })
  @ApiResponse({ type: SuccessResponseDto })
  async getStats() {
    const data = await this.service.getDashboardStats();
    return { message: 'HR dashboard metrics retrieved', data };
  }
}
