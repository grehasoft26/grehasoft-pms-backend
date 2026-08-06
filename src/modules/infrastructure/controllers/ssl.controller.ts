import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SslService } from '../services/ssl.service';
import { CreateSSLCertificateDto } from '../dto/monitoring.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('DevOps SSL Certificates')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('infrastructure/ssl')
export class SslController {
  constructor(private readonly service: SslService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Register an SSL certificate (Let’s Encrypt, Cloudflare, Sectigo, wildcard, auto-renew)' })
  @ApiResponse({ type: SuccessResponseDto })
  async install(@Body() dto: CreateSSLCertificateDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createCertificate(dto, context);
    return { message: 'SSL certificate registered successfully', data };
  }

  @Get()
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get list of registered SSL certificates' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.service.getCertificates();
    return { message: 'SSL certificates retrieved', data };
  }
}
