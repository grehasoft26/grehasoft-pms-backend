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
import { DashboardsService } from '../dashboards/dashboards.service';
import {
  CreateDashboardDto,
  ShareDashboardDto,
  AddWidgetDto,
  PinDashboardDto,
} from '../dto/dashboards.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('BI Dashboards')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('reports/dashboards')
export class DashboardsController {
  constructor(private readonly service: DashboardsService) {}

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
  @Permissions('dashboards.manage')
  @ApiOperation({
    summary: 'Create custom dashboard or instantiate from template',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateDashboardDto, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.createDashboard(tenantId, dto, context);
    return { message: 'Dashboard created successfully', data };
  }

  @Get()
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get list of personal/shared dashboards' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.getDashboards(tenantId, context);
    return { message: 'Dashboards retrieved successfully', data };
  }

  @Get('templates')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get list of reusable dashboard templates' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTemplates() {
    const data = await this.service.getTemplates();
    return { message: 'Templates retrieved successfully', data };
  }

  @Get('widgets')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get list of widgets from library' })
  @ApiResponse({ type: SuccessResponseDto })
  async getWidgets() {
    const data = await this.service.getWidgets();
    return { message: 'Widgets library retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('reports.read')
  @ApiOperation({
    summary: 'Get dashboard details with widgets panels layout configurations',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.getDashboard(tenantId, id, context);
    return { message: 'Dashboard details retrieved', data };
  }

  @Post(':id/shares')
  @Permissions('dashboards.manage')
  @ApiOperation({
    summary: 'Share dashboard with team member, roles or department',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async share(
    @Param('id') id: string,
    @Body() dto: ShareDashboardDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.shareDashboard(tenantId, id, dto, context);
    return { message: 'Dashboard shared successfully', data };
  }

  @Post(':id/widgets')
  @Permissions('dashboards.manage')
  @ApiOperation({
    summary: 'Add a visualization widget panel to dashboard layout',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async addWidget(
    @Param('id') id: string,
    @Body() dto: AddWidgetDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.addWidget(tenantId, id, dto, context);
    return { message: 'Widget added successfully', data };
  }

  @Post(':id/pin')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Pin or favorite dashboard' })
  @ApiResponse({ type: SuccessResponseDto })
  async pin(
    @Param('id') id: string,
    @Body() dto: PinDashboardDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.togglePin(
      tenantId,
      id,
      dto.isPinned,
      context,
    );
    return { message: 'Dashboard pinned state updated', data };
  }
}
