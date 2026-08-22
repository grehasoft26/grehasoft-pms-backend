import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AutomationHistoryService } from './automation-history.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Automation History')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications/automation')
export class AutomationHistoryController {
  constructor(private readonly service: AutomationHistoryService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Get('rules')
  @Permissions('automation.read')
  @ApiOperation({ summary: 'Get list of configured automation rules' })
  @ApiResponse({ type: SuccessResponseDto })
  async getRules(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getRules(tenantId);
    return { message: 'Automation rules retrieved successfully', data };
  }

  @Post('rules')
  @Permissions('automation.read')
  @ApiOperation({ summary: 'Create a new automated event-driven rule' })
  @ApiResponse({ type: SuccessResponseDto })
  async createRule(@Body() body: any, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.createRule(tenantId, body);
    return { message: 'Automation rule created successfully', data };
  }

  @Get('history')
  @Permissions('automation.read')
  @ApiOperation({ summary: 'Get list of automated execution runs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getExecutions(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getExecutions(tenantId);
    return { message: 'Executions histories retrieved successfully', data };
  }

  @Get('history/rules/:ruleId')
  @Permissions('automation.read')
  @ApiOperation({ summary: 'Get execution details for specific rule' })
  @ApiResponse({ type: SuccessResponseDto })
  async getExecutionLogs(@Param('ruleId') ruleId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getExecutionLogs(tenantId, ruleId);
    return { message: 'Rule executions logs retrieved successfully', data };
  }
}
