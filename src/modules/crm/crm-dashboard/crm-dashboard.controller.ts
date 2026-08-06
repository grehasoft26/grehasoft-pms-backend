import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CrmDashboardService } from './crm-dashboard.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('CRM Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('crm-dashboard')
export class CrmDashboardController {
  constructor(private readonly dashboardService: CrmDashboardService) {}

  @Get()
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Get CRM analytics metrics for dashboard reporting' })
  @ApiResponse({ type: SuccessResponseDto })
  async getStats() {
    const data = await this.dashboardService.getDashboardStats();
    return { message: 'CRM Dashboard metrics retrieved successfully', data };
  }
}
