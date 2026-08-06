import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from '../announcements/announcements.service';
import { CreateAnnouncementDto } from '../dto/announcements.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Announcements Board')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications/announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

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
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post()
  @Permissions('announcements.manage')
  @ApiOperation({ summary: 'Broadcast system announcement notice to board' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateAnnouncementDto, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.createAnnouncement(tenantId, dto, context);
    return { message: 'Announcement created successfully', data };
  }

  @Get()
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get announcements board filtered by department' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Req() req: Request, @Query('departmentId') departmentId?: string) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getAnnouncements(tenantId, departmentId);
    return { message: 'Announcements retrieved successfully', data };
  }
}
