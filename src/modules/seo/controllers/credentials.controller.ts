import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
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
import { WorkforceService } from '../workforce/services/workforce.service';
import { CreateSEOCredentialDto } from '../workforce/dto/workforce.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('SEO Credentials')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/credentials')
export class CredentialsController {
  constructor(private readonly service: WorkforceService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post()
  @Permissions('seo.credentials.manage')
  @ApiOperation({ summary: 'Create new SEO credential reference' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateSEOCredentialDto, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.createCredential(tenantId, dto);
    return { message: 'SEO credential created successfully', data };
  }

  @Get()
  @Permissions('seo.read')
  @ApiOperation({ summary: 'Get credentials list for a campaign' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(@Query('seoProjectId') seoProjectId: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getCredentials(tenantId, seoProjectId);
    return { message: 'SEO credentials retrieved', data };
  }

  @Get(':id/password')
  @Permissions('seo.credentials.manage')
  @ApiOperation({ summary: 'Access decrypted password secret from vault' })
  @ApiResponse({ type: SuccessResponseDto })
  async getPassword(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const password = await this.service.getCredentialPassword(tenantId, id);
    return {
      message: 'Secret password decrypted successfully',
      data: { password },
    };
  }

  @Delete(':id')
  @Permissions('seo.credentials.manage')
  @ApiOperation({ summary: 'Delete an SEO credential reference' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    await this.service.deleteCredential(tenantId, id);
    return { message: 'SEO credential deleted successfully' };
  }
}
