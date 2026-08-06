import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExportsService } from '../exports/exports.service';
import { TriggerExportDto } from '../dto/exports.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('BI Exports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('reports/exports')
export class ExportsController {
  constructor(private readonly service: ExportsService) {}

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
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post()
  @Permissions('exports.manage')
  @ApiOperation({ summary: 'Trigger report export job in background queue (PDF, Excel, CSV, PowerPoint)' })
  @ApiResponse({ type: SuccessResponseDto })
  async trigger(@Body() dto: TriggerExportDto, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.triggerExport(tenantId, dto, context);
    return { message: 'Export job queued successfully', data };
  }

  @Get()
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get report export job history logs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getExports(tenantId);
    return { message: 'Export history retrieved', data };
  }

  @Post(':id/download')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Record report download count audit logging' })
  @ApiResponse({ type: SuccessResponseDto })
  async download(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.incrementDownload(tenantId, id);
    return { message: 'Download counted successfully', data };
  }
}
