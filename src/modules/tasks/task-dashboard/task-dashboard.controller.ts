import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TaskDashboardService } from './task-dashboard.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Task Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('task-dashboard')
export class TaskDashboardController {
  constructor(private readonly dashboardService: TaskDashboardService) {}

  @Get()
  @Permissions('tasks.read')
  @ApiOperation({ summary: 'Get Task Dashboard statistics, sprint burndown, and team velocity metrics' })
  @ApiResponse({ type: SuccessResponseDto })
  async getStats(
    @Query('projectId') projectId?: string,
    @Req() req?: Request
  ) {
    const user = req ? (req as any).user : null;
    const userId = user?.id;
    const data = await this.dashboardService.getDashboardStats(userId, projectId);
    return { message: 'Task Dashboard statistics retrieved successfully', data };
  }
}
