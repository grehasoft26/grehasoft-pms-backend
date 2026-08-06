import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AutomationHistoryService } from './automation-history.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Automation History')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications/automation/history')
export class AutomationHistoryController {
  constructor(private readonly service: AutomationHistoryService) {}

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Get()
  @Permissions('automation.read')
  @ApiOperation({ summary: 'Get list of automated execution runs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getExecutions(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getExecutions(tenantId);
    return { message: 'Executions histories retrieved successfully', data };
  }

  @Get('rules/:ruleId')
  @Permissions('automation.read')
  @ApiOperation({ summary: 'Get execution details for specific rule' })
  @ApiResponse({ type: SuccessResponseDto })
  async getExecutionLogs(@Param('ruleId') ruleId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getExecutionLogs(tenantId, ruleId);
    return { message: 'Rule executions logs retrieved successfully', data };
  }
}
