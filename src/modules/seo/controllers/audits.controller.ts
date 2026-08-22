import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditsService } from '../audits/audits.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Technical SEO Crawls & Audits')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/audits')
export class AuditsController {
  constructor(private readonly service: AuditsService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post('run')
  @Permissions('audits.manage')
  @ApiOperation({ summary: 'Trigger technical crawler audit run on project' })
  @ApiResponse({ type: SuccessResponseDto })
  async triggerCrawl(
    @Param('seoProjectId') seoProjectId: string,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.runCrawlAudit(tenantId, seoProjectId);
    return { message: 'Technical audit completed successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get list of technical crawler audits history' })
  @ApiResponse({ type: SuccessResponseDto })
  async getAudits(
    @Param('seoProjectId') seoProjectId: string,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getAudits(tenantId, seoProjectId);
    return { message: 'Audits history log retrieved', data };
  }
}
