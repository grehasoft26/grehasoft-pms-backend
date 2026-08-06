import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RobotsService } from '../robots/robots.service';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Sitemaps & Robots')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/robots')
export class RobotsController {
  constructor(private readonly service: RobotsService) {}

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post('generate')
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Generate and save Robots.txt directives file content' })
  @ApiResponse({ type: SuccessResponseDto })
  async generate(
    @Param('seoProjectId') seoProjectId: string,
    @Body() body: { domain: string; disallows: string[] },
    @Req() req: Request
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.generateRobots(tenantId, seoProjectId, body.domain, body.disallows);
    return { message: 'Robots.txt generated successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get current Robots.txt content directives' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getRobots(tenantId, seoProjectId);
    return { message: 'Robots.txt content retrieved', data };
  }
}
