import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReminderService } from '../reminders/reminders.service';
import { CreateReminderDto } from '../dto/reminders.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('BI Reminders')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications/reminders')
export class RemindersController {
  constructor(private readonly service: ReminderService) {}

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post()
  @Permissions('reminders.manage')
  @ApiOperation({ summary: 'Create new scheduled reminder task' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateReminderDto, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.createReminder(tenantId, dto);
    return { message: 'Reminder created successfully', data };
  }

  @Get()
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get reminders logs list' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Req() req: Request, @Query('isCompleted') isCompleted?: string) {
    const tenantId = this.getTenantId(req);
    const completedFlag = isCompleted === 'true' ? true : isCompleted === 'false' ? false : undefined;
    const data = await this.service.getReminders(tenantId, completedFlag);
    return { message: 'Reminders list retrieved', data };
  }

  @Post('trigger')
  @Permissions('reminders.manage')
  @ApiOperation({ summary: 'Trigger manual check runs on all overdue reminders' })
  @ApiResponse({ type: SuccessResponseDto })
  async trigger(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.triggerReminderRuns(tenantId);
    return { message: 'Overdue reminders processed', data };
  }
}
