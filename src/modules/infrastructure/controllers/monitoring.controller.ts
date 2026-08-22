import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
import { MonitoringService } from '../services/monitoring.service';
import { UpdateMonitoringCheckDto } from '../dto/monitoring.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('DevOps Monitoring')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('infrastructure/monitoring')
export class MonitoringController {
  constructor(private readonly service: MonitoringService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('metrics/:serverId')
  @Permissions('infrastructure.manage')
  @ApiOperation({
    summary:
      'Record CPU, RAM, Disk, Load averages, Network load metrics and trigger warnings',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async record(
    @Param('serverId') serverId: string,
    @Body() dto: UpdateMonitoringCheckDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.recordMetrics(serverId, dto, context);
    return { message: 'Monitoring check logged successfully', data };
  }

  @Get()
  @Permissions('monitoring.read')
  @ApiOperation({ summary: 'Get list of monitoring checks' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(
    @Query('serverId') serverId?: string,
    @Query('domainId') domainId?: string,
  ) {
    const data = await this.service.getChecks(serverId, domainId);
    return { message: 'Monitoring checks retrieved', data };
  }
}
