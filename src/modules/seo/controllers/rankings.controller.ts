import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RankingsService } from '../rankings/rankings.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Rankings Tracker')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/rankings')
export class RankingsController {
  constructor(private readonly service: RankingsService) {}

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Get('visibility')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get current rankings visibility score percentage' })
  @ApiResponse({ type: SuccessResponseDto })
  async getVisibility(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getVisibilityScore(tenantId, seoProjectId);
    return { message: 'Visibility score calculated', data };
  }

  @Get('keywords/:keywordId/history')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get position history log for keyword' })
  @ApiResponse({ type: SuccessResponseDto })
  async getHistory(@Param('keywordId') keywordId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getRankingHistory(tenantId, keywordId);
    return { message: 'Ranking history retrieved', data };
  }
}
