import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProjectDashboardService } from './project-dashboard.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-dashboard')
export class ProjectDashboardController {
  constructor(private readonly dashboardService: ProjectDashboardService) {}

  @Get()
  @Permissions('projects.read')
  @ApiOperation({ summary: 'Get Project Dashboard statistics and metrics' })
  @ApiResponse({ type: SuccessResponseDto })
  async getStats(@Req() req: Request) {
    const user = (req as any).user;
    const userId = user?.id;
    const data = await this.dashboardService.getDashboardStats(userId);
    return {
      message: 'Project Dashboard metrics retrieved successfully',
      data,
    };
  }
}
