import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FinancialDashboardService } from '../services/dashboard.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Finance Dashboard & Reporting')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('finance/dashboard')
export class FinancialDashboardController {
  constructor(private readonly service: FinancialDashboardService) {}

  @Get('stats')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get summary metrics: today/monthly revenue, outstanding collections, overdue, profit, receivables/payables accounts' })
  @ApiResponse({ type: SuccessResponseDto })
  async getStats() {
    const data = await this.service.getDashboardStats();
    return { message: 'Financial dashboard statistics retrieved', data };
  }

  @Get('project-profitability')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get project profitability report comparing total invoices vs total paid expenses' })
  @ApiResponse({ type: SuccessResponseDto })
  async getProjectProfitability(@Query('projectId') projectId: string) {
    const data = await this.service.getProjectProfitability(projectId);
    return { message: 'Project profitability analysis completed', data };
  }
}
