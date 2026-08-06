import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KeywordsService } from '../keywords/keywords.service';
import { CreateKeywordDto, CreateKeywordGroupDto } from '../dto/keywords.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('SEO Keywords')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/keywords')
export class KeywordsController {
  constructor(private readonly service: KeywordsService) {}

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post()
  @Permissions('keywords.manage')
  @ApiOperation({ summary: 'Add tracked keyword to SEO Project' })
  @ApiResponse({ type: SuccessResponseDto })
  async addKeyword(
    @Param('seoProjectId') seoProjectId: string,
    @Body() dto: CreateKeywordDto,
    @Req() req: Request
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.addKeyword(tenantId, seoProjectId, dto);
    return { message: 'Keyword added to project successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get list of tracked keywords' })
  @ApiResponse({ type: SuccessResponseDto })
  async getKeywords(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getKeywords(tenantId, seoProjectId);
    return { message: 'Keywords retrieved successfully', data };
  }

  @Post('groups')
  @Permissions('keywords.manage')
  @ApiOperation({ summary: 'Create logical keyword cluster group' })
  @ApiResponse({ type: SuccessResponseDto })
  async createGroup(
    @Param('seoProjectId') seoProjectId: string,
    @Body() dto: CreateKeywordGroupDto,
    @Req() req: Request
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.createGroup(tenantId, seoProjectId, dto);
    return { message: 'Keyword group created', data };
  }

  @Get('groups')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get keyword cluster groups' })
  @ApiResponse({ type: SuccessResponseDto })
  async getGroups(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getGroups(tenantId, seoProjectId);
    return { message: 'Keyword groups list retrieved', data };
  }

  @Post('cluster')
  @Permissions('keywords.manage')
  @ApiOperation({ summary: 'Run automatic clustering algorithm on project keywords' })
  @ApiResponse({ type: SuccessResponseDto })
  async runClustering(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.runKeywordClustering(tenantId, seoProjectId);
    return { message: 'Semantic clustering completed successfully', data };
  }
}
