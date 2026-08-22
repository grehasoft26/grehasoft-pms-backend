import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WebhookService } from '../webhooks/webhook.service';
import { RegisterWebhookDto } from '../dto/webhooks.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Outbound Webhooks')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications/webhooks')
export class WebhooksController {
  constructor(private readonly service: WebhookService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post('subscriptions')
  @Permissions('notifications.manage')
  @ApiOperation({ summary: 'Register a client endpoint subscription' })
  @ApiResponse({ type: SuccessResponseDto })
  async register(@Body() dto: RegisterWebhookDto, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.registerSubscription(tenantId, dto);
    return { message: 'Webhook subscription registered successfully', data };
  }

  @Get('subscriptions')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get list of registered subscriptions' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getSubscriptions(tenantId);
    return { message: 'Webhook subscriptions list retrieved', data };
  }
}
