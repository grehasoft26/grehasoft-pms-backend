import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TimeTrackingDashboardService } from './dashboard.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Time Tracking Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('timetracking-dashboard')
export class TimeTrackingDashboardController {
  constructor(private readonly service: TimeTrackingDashboardService) {}

  @Get()
  @Permissions('timetracking.read')
  @ApiOperation({
    summary:
      'Get active working/idle users, today/weekly hours and top productivity ranks',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getStats() {
    const data = await this.service.getDashboardStats();
    return {
      message: 'Time Tracking Dashboard metrics retrieved successfully',
      data,
    };
  }
}
