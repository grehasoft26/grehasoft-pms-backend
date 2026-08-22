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
import { KpisService } from '../kpis/kpis.service';
import { CreateKpiDefinitionDto } from '../dto/kpis.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('BI KPIs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('reports/kpis')
export class KpisController {
  constructor(private readonly service: KpisService) {}

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
  @ApiOperation({ summary: 'Create KPI Definition target thresholds warnings' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateKpiDefinitionDto, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.createDefinition(tenantId, dto, context);
    return { message: 'KPI Definition configured successfully', data };
  }

  @Get()
  @Permissions('analytics.read')
  @ApiOperation({ summary: 'Get list of defined KPIs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getDefinitions(tenantId);
    return { message: 'KPI definitions retrieved', data };
  }

  @Post('calculate/:code')
  @Permissions('analytics.read')
  @ApiOperation({
    summary: 'Trigger mathematical formula calculation and log snapshot value',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async calculate(@Param('code') code: string, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.calculateAndRecordKpi(
      tenantId,
      code,
      context,
    );
    return {
      message: 'KPI calculated and snapshot recorded successfully',
      data,
    };
  }

  @Get(':id/history')
  @Permissions('analytics.read')
  @ApiOperation({
    summary: 'Get historical snapshot entries log for KPI definition',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getHistory(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getKpiSnapshotHistory(tenantId, id);
    return { message: 'KPI snapshot history retrieved', data };
  }
}
