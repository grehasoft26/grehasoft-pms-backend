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
import { ProjectsService } from '../projects/projects.service';
import { CreateSEOProjectDto } from '../dto/projects.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('SEO Projects')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post()
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Create new SEO Project domain tracking' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateSEOProjectDto, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.create(tenantId, dto);
    return { message: 'SEO Project created successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get list of SEO Projects' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getProjects(tenantId);
    return { message: 'SEO Projects list retrieved', data };
  }

  @Get(':id')
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get single SEO Project domain detail' })
  @ApiResponse({ type: SuccessResponseDto })
  async getOne(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getProject(tenantId, id);
    return { message: 'SEO Project detail retrieved', data };
  }
}
