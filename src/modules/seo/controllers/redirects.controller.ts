import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RedirectsService } from '../redirects/redirects.service';
import { CreateRedirectDto } from '../dto/redirects.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Redirect Management')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/redirects')
export class RedirectsController {
  constructor(private readonly service: RedirectsService) {}

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post()
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Create redirect rule' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(
    @Param('seoProjectId') seoProjectId: string,
    @Body() dto: CreateRedirectDto,
    @Req() req: Request
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.addRedirect(tenantId, seoProjectId, dto);
    return { message: 'Redirect rule created successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get redirects list mapping' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getRedirects(tenantId, seoProjectId);
    return { message: 'Redirects mapping list retrieved', data };
  }
}
