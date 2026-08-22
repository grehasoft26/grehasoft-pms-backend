import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { AnalyticsService } from '../analytics/analytics.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Google Search Console & GA4 Integrations')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post('gsc/import')
  @Permissions('seo.manage')
  @ApiOperation({
    summary: 'Import Google Search Console site metrics parameters',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async importGsc(
    @Param('seoProjectId') seoProjectId: string,
    @Body()
    body: {
      siteUrl: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    },
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.importGoogleSearchConsoleMetrics(
      tenantId,
      seoProjectId,
      body.siteUrl,
      body,
    );
    return {
      message: 'Google Search Console metrics imported successfully',
      data,
    };
  }

  @Get('gsc/properties')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get active GSC property profiles' })
  @ApiResponse({ type: SuccessResponseDto })
  async getGscProperties(
    @Param('seoProjectId') seoProjectId: string,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getSearchConsoleProperties(
      tenantId,
      seoProjectId,
    );
    return { message: 'Google Search Console properties list retrieved', data };
  }

  @Post('ga4/import')
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Import Google Analytics 4 property metrics' })
  @ApiResponse({ type: SuccessResponseDto })
  async importGa4(
    @Param('seoProjectId') seoProjectId: string,
    @Body()
    body: {
      measurementId: string;
      activeUsers: number;
      sessions: number;
      bounceRate: number;
    },
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.importGoogleAnalyticsMetrics(
      tenantId,
      seoProjectId,
      body.measurementId,
      body,
    );
    return {
      message: 'Google Analytics 4 metrics imported successfully',
      data,
    };
  }

  @Get('ga4/properties')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get GA4 properties metric records' })
  @ApiResponse({ type: SuccessResponseDto })
  async getGa4Properties(
    @Param('seoProjectId') seoProjectId: string,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getAnalyticsProperties(
      tenantId,
      seoProjectId,
    );
    return { message: 'Google Analytics 4 properties retrieved', data };
  }
}
