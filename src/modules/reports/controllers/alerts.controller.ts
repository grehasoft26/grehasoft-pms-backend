import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AlertsService } from '../alerts/alerts.service';
import { TriggerAlertDto } from '../dto/alerts.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('BI Alerts')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('reports/alerts')
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post()
  @Permissions('reports.manage')
  @ApiOperation({ summary: 'Trigger custom Business Alert event notification' })
  @ApiResponse({ type: SuccessResponseDto })
  async trigger(@Body() dto: TriggerAlertDto, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.triggerAlert(tenantId, dto, context);
    return {
      message: 'Alert triggered and notification event logged successfully',
      data,
    };
  }

  @Get()
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get list of triggered business alerts' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getAlerts(tenantId);
    return { message: 'Business alerts log retrieved successfully', data };
  }
}
