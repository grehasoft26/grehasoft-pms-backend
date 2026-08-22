import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InfrastructureDashboardService } from '../services/dashboard.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('DevOps Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('infrastructure/dashboard')
export class InfrastructureDashboardController {
  constructor(private readonly service: InfrastructureDashboardService) {}

  @Get('stats')
  @Permissions('monitoring.read')
  @ApiOperation({
    summary:
      'Get DevOps dashboard metrics (expiring domains/SSL, backup failures, open incidents, average uptime)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getStats() {
    const data = await this.service.getDashboardStats();
    return { message: 'Infrastructure metrics retrieved successfully', data };
  }
}
