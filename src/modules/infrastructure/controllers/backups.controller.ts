import {
  Body,
  Controller,
  Get,
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
import { BackupsService } from '../services/backups.service';
import { CreateBackupScheduleDto, CreateBackupDto } from '../dto/backups.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('DevOps Backups')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('infrastructure/backups')
export class BackupsController {
  constructor(private readonly service: BackupsService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('schedules')
  @Permissions('backups.manage')
  @ApiOperation({ summary: 'Create backup schedule (frequency, retention)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createSchedule(
    @Body() dto: CreateBackupScheduleDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.createSchedule(dto, context);
    return { message: 'Backup schedule created successfully', data };
  }

  @Get('schedules')
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get list of backup schedules' })
  @ApiResponse({ type: SuccessResponseDto })
  async getSchedules(@Query('serverId') serverId?: string) {
    const data = await this.service.getSchedules(serverId);
    return { message: 'Backup schedules retrieved', data };
  }

  @Post('manual')
  @Permissions('backups.manage')
  @ApiOperation({
    summary:
      'Trigger manual backup (database, files, incremental/full, encryption checks)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async trigger(@Body() dto: CreateBackupDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.triggerBackup(dto, context);
    return {
      message: 'Manual backup triggered and finished successfully',
      data,
    };
  }

  @Get()
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get backup history logs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(
    @Query('serverId') serverId?: string,
    @Query('hostingAccountId') hostingAccountId?: string,
  ) {
    const data = await this.service.getBackups(serverId, hostingAccountId);
    return { message: 'Backups list retrieved', data };
  }
}
