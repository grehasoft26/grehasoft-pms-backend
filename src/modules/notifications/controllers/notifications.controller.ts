import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '../notifications/notifications.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Notifications Center')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  private getUserId(req: Request): string {
    const user = (req as any).user;
    return user?.id || (req.headers['x-user-id'] as string) || 'system';
  }

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Get()
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get list of notifications (all or unread only)' })
  @ApiResponse({ type: SuccessResponseDto })
  async getNotifications(@Req() req: Request, @Query('unread') unread?: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    const unreadOnly = unread === 'true';
    const data = await this.service.getNotifications(tenantId, userId, unreadOnly);
    return { message: 'Notifications retrieved successfully', data };
  }

  @Post(':id/read')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ type: SuccessResponseDto })
  async markRead(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.markRead(tenantId, id);
    return { message: 'Notification marked as read', data };
  }

  @Post(':id/click')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Log click analytics on notification' })
  @ApiResponse({ type: SuccessResponseDto })
  async markClick(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.markClicked(tenantId, id);
    return { message: 'Notification click logged successfully', data };
  }

  @Post(':id/archive')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Archive notification' })
  @ApiResponse({ type: SuccessResponseDto })
  async archive(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.archive(tenantId, id);
    return { message: 'Notification archived successfully', data };
  }
}
