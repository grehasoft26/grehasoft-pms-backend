import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompetitorsService } from '../competitors/competitors.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Competitors Analysis')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/competitors')
export class CompetitorsController {
  constructor(private readonly service: CompetitorsService) {}

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post()
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Register competitor site domain' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(
    @Param('seoProjectId') seoProjectId: string,
    @Body() body: { name: string; domain: string },
    @Req() req: Request
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.addCompetitor(tenantId, seoProjectId, body.name, body.domain);
    return { message: 'Competitor domain added successfully', data };
  }

  @Get('visibility')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Compare rankings visibility with competitors' })
  @ApiResponse({ type: SuccessResponseDto })
  async getComparison(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.compareVisibility(tenantId, seoProjectId);
    return { message: 'Competitor visibility comparison calculated', data };
  }
}
