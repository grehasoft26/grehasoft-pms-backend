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
import { SitemapService } from '../sitemap/sitemap.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Sitemaps & Robots')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/sitemaps')
export class SitemapsController {
  constructor(private readonly service: SitemapService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post('generate')
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Generate XML sitemap file content' })
  @ApiResponse({ type: SuccessResponseDto })
  async generate(
    @Param('seoProjectId') seoProjectId: string,
    @Body() body: { domain: string; paths: string[] },
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.generateXmlSitemap(
      tenantId,
      seoProjectId,
      body.domain,
      body.paths,
    );
    return { message: 'XML sitemap compiled successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get generated sitemaps XML records' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getSitemaps(tenantId, seoProjectId);
    return { message: 'Sitemaps records retrieved', data };
  }
}
