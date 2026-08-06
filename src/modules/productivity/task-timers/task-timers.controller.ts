import { Body, Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TaskTimersService } from './task-timers.service';
import { StartTimerDto, HeartbeatTimerDto } from './dto/task-timers.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Task Timers')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('task-timers')
export class TaskTimersController {
  constructor(private readonly service: TaskTimersService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('start')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Start task timer' })
  @ApiResponse({ type: SuccessResponseDto })
  async startTimer(@Body() dto: StartTimerDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.startTimer(dto, context);
    return { message: 'Task timer started', data };
  }

  @Post(':id/pause')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Pause task timer' })
  @ApiResponse({ type: SuccessResponseDto })
  async pauseTimer(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.pauseTimer(id, context);
    return { message: 'Task timer paused', data };
  }

  @Post(':id/resume')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Resume paused task timer' })
  @ApiResponse({ type: SuccessResponseDto })
  async resumeTimer(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.resumeTimer(id, context);
    return { message: 'Task timer resumed', data };
  }

  @Post(':id/stop')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Stop timer & convert to TimeEntry (single source of truth)' })
  @ApiResponse({ type: SuccessResponseDto })
  async stopTimer(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.stopTimer(id, context);
    return { message: 'Task timer stopped. TimeEntry generated successfully', data };
  }

  @Post(':id/heartbeat')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Sync client heartbeat elapsed seconds to protect against crashes/abandonment' })
  @ApiResponse({ type: SuccessResponseDto })
  async sendHeartbeat(@Param('id') id: string, @Body() dto: HeartbeatTimerDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.sendHeartbeat(id, dto, context);
    return { message: 'Heartbeat received', data };
  }
}
