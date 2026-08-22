import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
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
import { ReminderService } from '../reminders/reminders.service';
import { CreateReminderDto, UpdateReminderDto } from '../dto/reminders.dto';
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

  private getUserId(req: Request): string {
    const user = (req as any).user;
    return user?.id || (req.headers['x-user-id'] as string) || 'system';
  }

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  private isAdminUser(req: Request): boolean {
    const user = (req as any).user;
    return (
      user?.role?.name === 'Super Admin' ||
      user?.role?.name === 'Admin' ||
      user?.role?.name === 'Company Admin'
    );
  }

  @Post()
  @Permissions('reminders.manage')
  @ApiOperation({ summary: 'Create new scheduled reminder task' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateReminderDto, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    const data = await this.service.createReminder(tenantId, dto, userId);
    return { message: 'Reminder created successfully', data };
  }

  @Get()
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get reminders logs list' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Req() req: Request, @Query('isCompleted') isCompleted?: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    const isAdmin = this.isAdminUser(req);
    const completedFlag =
      isCompleted === 'true'
        ? true
        : isCompleted === 'false'
          ? false
          : undefined;
    const data = await this.service.getReminders(
      tenantId,
      completedFlag,
      isAdmin ? undefined : userId,
    );
    return { message: 'Reminders list retrieved', data };
  }

  @Get('summary')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get reminders counts summary' })
  @ApiResponse({ type: SuccessResponseDto })
  async getSummary(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    const isAdmin = this.isAdminUser(req);
    const data = await this.service.getRemindersSummary(
      tenantId,
      isAdmin ? undefined : userId,
    );
    return { message: 'Reminders summary retrieved', data };
  }

  @Get(':id')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get single reminder details' })
  @ApiResponse({ type: SuccessResponseDto })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    const isAdmin = this.isAdminUser(req);
    const data = await this.service.getReminderById(
      tenantId,
      id,
      userId,
      isAdmin,
    );
    return { message: 'Reminder details retrieved', data };
  }

  @Patch(':id')
  @Permissions('reminders.manage')
  @ApiOperation({ summary: 'Update existing scheduled reminder task' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    const isAdmin = this.isAdminUser(req);
    const data = await this.service.updateReminder(
      tenantId,
      id,
      dto,
      userId,
      isAdmin,
    );
    return { message: 'Reminder updated successfully', data };
  }

  @Delete(':id')
  @Permissions('reminders.manage')
  @ApiOperation({ summary: 'Delete scheduled reminder task' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    const isAdmin = this.isAdminUser(req);
    const data = await this.service.deleteReminder(
      tenantId,
      id,
      userId,
      isAdmin,
    );
    return { message: 'Reminder deleted successfully', data };
  }

  @Patch(':id/complete')
  @Permissions('reminders.manage')
  @ApiOperation({ summary: 'Toggle completion status of reminder' })
  @ApiResponse({ type: SuccessResponseDto })
  async complete(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    const isAdmin = this.isAdminUser(req);
    const data = await this.service.toggleReminderCompletion(
      tenantId,
      id,
      userId,
      isAdmin,
    );
    return { message: 'Reminder completion status updated', data };
  }

  @Post('trigger')
  @Permissions('reminders.manage')
  @ApiOperation({
    summary: 'Trigger manual check runs on all overdue reminders',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async trigger(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.triggerReminderRuns(tenantId);
    return { message: 'Overdue reminders processed', data };
  }
}
