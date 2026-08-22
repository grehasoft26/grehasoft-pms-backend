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
import { AttendanceService } from '../services/attendance.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('HR Attendance')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('sync-session/:sessionId')
  @Permissions('attendance.manage')
  @ApiOperation({
    summary: 'Link daily attendance record from an active WorkSession',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async syncSession(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.generateDailyAttendance(sessionId, context);
    return {
      message: 'Attendance synced from work session successfully',
      data,
    };
  }

  @Get()
  @Permissions('attendance.read')
  @ApiOperation({ summary: 'Get list of attendance logs with filters' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(
    @Query('profileId') profileId?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
    const data = await this.service.getAttendances({
      profileId,
      dateStart,
      dateEnd,
    });
    return { message: 'Attendance records retrieved', data };
  }

  @Get(':profileId/:date')
  @Permissions('attendance.read')
  @ApiOperation({ summary: 'Get specific daily attendance details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getRecord(
    @Param('profileId') profileId: string,
    @Param('date') date: string,
  ) {
    const data = await this.service.getAttendanceRecord(profileId, date);
    return { message: 'Daily attendance record details', data };
  }
}
