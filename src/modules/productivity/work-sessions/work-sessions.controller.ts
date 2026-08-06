import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkSessionsService } from './work-sessions.service';
import { StartWorkSessionDto, LogBreakDto, LogIdleDto, LogActivityDto, LogAppUsageDto, LogWebUsageDto, LogScreenshotDto } from './dto/work-sessions.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Time Tracking Work Sessions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('work-sessions')
export class WorkSessionsController {
  constructor(private readonly service: WorkSessionsService) {}

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
  @ApiOperation({ summary: 'Check in / start new work session' })
  @ApiResponse({ type: SuccessResponseDto })
  async startSession(@Body() dto: StartWorkSessionDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.startSession(dto, context);
    return { message: 'Work session started successfully', data };
  }

  @Post('end')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Check out / end active work session' })
  @ApiResponse({ type: SuccessResponseDto })
  async endSession(@Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.endSession(context);
    return { message: 'Work session ended successfully', data };
  }

  @Get('active')
  @Permissions('timetracking.read')
  @ApiOperation({ summary: 'Get active work session details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getActive(@Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.getActiveSession(context.userId);
    return { message: 'Active work session retrieved', data };
  }

  @Post('breaks/start')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Start a break session (lunch, tea, personal)' })
  @ApiResponse({ type: SuccessResponseDto })
  async startBreak(@Body() dto: LogBreakDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.startBreak(dto, context);
    return { message: 'Break session started', data };
  }

  @Post('breaks/end')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'End active break session' })
  @ApiResponse({ type: SuccessResponseDto })
  async endBreak(@Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.endBreak(context);
    return { message: 'Break session ended', data };
  }

  @Post('idles/start')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Start idle session detection (system lock, screen saver)' })
  @ApiResponse({ type: SuccessResponseDto })
  async startIdle(@Body() dto: LogIdleDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.startIdle(dto, context);
    return { message: 'Idle session started', data };
  }

  @Post('idles/end')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'End active idle session' })
  @ApiResponse({ type: SuccessResponseDto })
  async endIdle(@Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.endIdle(context);
    return { message: 'Idle session ended', data };
  }

  @Post('activity')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Log keyboard/mouse activity statistics counters' })
  @ApiResponse({ type: SuccessResponseDto })
  async logActivity(@Body() dto: LogActivityDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.logActivity(dto, context);
    return { message: 'Activity statistics logged', data };
  }

  @Post('screenshots')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Log desktop screenshots metadata upload logs' })
  @ApiResponse({ type: SuccessResponseDto })
  async uploadScreenshot(@Body() dto: LogScreenshotDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.uploadScreenshot(dto, context);
    return { message: 'Screenshot metadata logged', data };
  }

  @Post('applications')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Log application usage duration statistics' })
  @ApiResponse({ type: SuccessResponseDto })
  async logApplication(@Body() dto: LogAppUsageDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.logApplication(dto, context);
    return { message: 'Application usage logged', data };
  }

  @Post('websites')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Log website/domain usage duration statistics' })
  @ApiResponse({ type: SuccessResponseDto })
  async logWebsite(@Body() dto: LogWebUsageDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.logWebsite(dto, context);
    return { message: 'Website usage logged', data };
  }
}
