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
import { SchemaService } from '../schema/schema.service';
import { CreateSchemaDto } from '../dto/schema.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Schema Markup')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/projects/:seoProjectId/schemas')
export class SchemaController {
  constructor(private readonly service: SchemaService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post('generate')
  @Permissions('seo.manage')
  @ApiOperation({ summary: 'Generate JSON-LD schema markup script' })
  @ApiResponse({ type: SuccessResponseDto })
  async generate(
    @Param('seoProjectId') seoProjectId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.generateAndSaveSchema(
      tenantId,
      seoProjectId,
      body.urlPath,
      body.type,
      body.data,
    );
    return { message: 'JSON-LD Schema markup generated successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get generated schema markups scripts list' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Param('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getSchemas(tenantId, seoProjectId);
    return { message: 'Schema markups list retrieved', data };
  }
}
