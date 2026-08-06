import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BacklinksService } from '../backlinks/backlinks.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Backlinks & Referring Domains')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/backlinks')
export class BacklinksController {
  constructor(private readonly service: BacklinksService) {}

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post()
  @Permissions('backlinks.manage')
  @ApiOperation({ summary: 'Register referring domain backlink' })
  @ApiResponse({ type: SuccessResponseDto })
  async addBacklink(@Param('seoProjectId') seoProjectId: string, @Body() body: any, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.addBacklink(tenantId, seoProjectId, body);
    return { message: 'Backlink logged successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get list of logged backlinks' })
  @ApiResponse({ type: SuccessResponseDto })
  async getBacklinks(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getBacklinks(tenantId, seoProjectId);
    return { message: 'Backlinks list retrieved', data };
  }

  @Post('broken')
  @Permissions('backlinks.manage')
  @ApiOperation({ summary: 'Report broken link 404 error path' })
  @ApiResponse({ type: SuccessResponseDto })
  async reportBroken(@Param('seoProjectId') seoProjectId: string, @Body() body: any, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.reportBrokenLink(tenantId, seoProjectId, body.sourceUrl, body.targetUrl, body.statusCode);
    return { message: 'Broken 404 path logged', data };
  }

  @Get('broken')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get logged broken link 404 paths list' })
  @ApiResponse({ type: SuccessResponseDto })
  async getBroken(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getBrokenLinks(tenantId, seoProjectId);
    return { message: 'Broken links list retrieved', data };
  }
}
