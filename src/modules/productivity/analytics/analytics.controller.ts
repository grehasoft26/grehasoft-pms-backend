import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductivityScoreService } from './productivity-score.service';
import { UtilizationReportService } from './utilization-report.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Time Tracking Analytics & Reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('productivity-analytics')
export class ProductivityAnalyticsController {
  constructor(
    private readonly scoreService: ProductivityScoreService,
    private readonly reportService: UtilizationReportService
  ) {}

  @Post('scores/calculate')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Calculate daily productivity scores for a user' })
  @ApiResponse({ type: SuccessResponseDto })
  async calculateScore(
    @Query('userId') userId: string,
    @Query('date') dateStr: string
  ) {
    const date = new Date(dateStr);
    const data = await this.scoreService.calculateDailyScore(userId, date);
    return { message: 'Productivity score calculated successfully', data };
  }

  @Get('utilization/report')
  @Permissions('timetracking.read')
  @ApiOperation({ summary: 'Generate utilization report across project, employee, team or department' })
  @ApiResponse({ type: SuccessResponseDto })
  async generateReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('teamId') teamId?: string,
    @Query('departmentId') departmentId?: string
  ) {
    const data = await this.reportService.generateReport({
      userId,
      projectId,
      teamId,
      departmentId,
      startDate,
      endDate,
    });
    return { message: 'Utilization report generated successfully', data };
  }
}
