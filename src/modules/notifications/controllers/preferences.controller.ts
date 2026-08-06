import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PreferencesService } from '../preferences/preferences.service';
import { UpdatePreferenceDto } from '../dto/preferences.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Notifications Preferences')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications/preferences')
export class PreferencesController {
  constructor(private readonly service: PreferencesService) {}

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

  @Get()
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get user preferences (quiet hours and digest options)' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const userId = this.getContext(req).userId;
    const data = await this.service.getPreferences(tenantId, userId);
    return { message: 'Preferences retrieved successfully', data };
  }

  @Post()
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Upsert notifications preference settings' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Body() dto: UpdatePreferenceDto, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.service.updatePreference(tenantId, context.userId, dto, context);
    return { message: 'Preference updated successfully', data };
  }
}
