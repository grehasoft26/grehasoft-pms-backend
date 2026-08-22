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
import { PagesService } from '../pages/pages.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('On-Page SEO')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/pages')
export class PagesController {
  constructor(private readonly service: PagesService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post()
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Upsert Page SEO metadata' })
  @ApiResponse({ type: SuccessResponseDto })
  async upsertPage(
    @Param('seoProjectId') seoProjectId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.upsertPageSEO(
      tenantId,
      seoProjectId,
      body.urlPath,
      body,
    );
    return { message: 'Page SEO metadata updated', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get list of configured Page SEO parameters' })
  @ApiResponse({ type: SuccessResponseDto })
  async getPages(
    @Param('seoProjectId') seoProjectId: string,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getPages(tenantId, seoProjectId);
    return { message: 'Page SEO profiles retrieved', data };
  }
}
