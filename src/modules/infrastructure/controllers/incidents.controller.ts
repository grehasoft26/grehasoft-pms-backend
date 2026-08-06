import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IncidentsService } from '../services/incidents.service';
import { CreateIncidentDto, CreateMaintenanceWindowDto } from '../dto/incidents.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('DevOps Incidents & Maintenance')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('infrastructure/incidents')
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Report an infrastructure service incident (severity, priority, affectedServices)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createIncident(@Body() dto: CreateIncidentDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createIncident(dto, context);
    return { message: 'Incident reported successfully', data };
  }

  @Patch(':id/resolve')
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Resolve incident with rootCause and postmortem details' })
  @ApiResponse({ type: SuccessResponseDto })
  async resolveIncident(@Param('id') id: string, @Body() dto: any, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.resolveIncident(id, dto, context);
    return { message: 'Incident resolved successfully', data };
  }

  @Get()
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get list of reported incidents' })
  @ApiResponse({ type: SuccessResponseDto })
  async getIncidents(@Query('status') status?: string) {
    const data = await this.service.getIncidents(status);
    return { message: 'Incidents list retrieved', data };
  }

  @Post('maintenance')
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Schedule a maintenance window' })
  @ApiResponse({ type: SuccessResponseDto })
  async createMaintenance(@Body() dto: CreateMaintenanceWindowDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createMaintenanceWindow(dto, context);
    return { message: 'Maintenance window scheduled successfully', data };
  }

  @Get('maintenance')
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get scheduled maintenance windows' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMaintenance() {
    const data = await this.service.getMaintenanceWindows();
    return { message: 'Maintenance calendar retrieved', data };
  }
}
