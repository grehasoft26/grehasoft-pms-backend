import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkforceService } from '../workforce/services/workforce.service';
import {
  CreateSEODailyWorkLogDto,
  UpdateSEODailyWorkLogDto,
  ReviewSEODailyWorkLogDto,
} from '../workforce/dto/workforce.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('SEO Daily Work Logs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('seo/work-logs')
export class WorkLogsController {
  constructor(private readonly service: WorkforceService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post()
  @Permissions('seo.worklog.manage')
  @ApiOperation({ summary: 'Submit or save draft daily work log' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateSEODailyWorkLogDto, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const user = (req as any).user;
    const data = await this.service.createWorkLog(
      tenantId,
      user?.id || 'system',
      dto,
    );
    return { message: 'SEO Daily Work Log created successfully', data };
  }

  @Get()
  @Permissions('seo.worklog.read')
  @ApiOperation({ summary: 'Get list of daily work logs' })
  @ApiResponse({ type: SuccessResponseDto })
  async get(
    @Req() req: Request,
    @Query('executiveId') executiveId?: string,
    @Query('seoProjectId') seoProjectId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getWorkLogs(tenantId, {
      executiveId,
      seoProjectId,
      status,
    });
    return { message: 'SEO Daily Work Logs list retrieved', data };
  }

  @Get(':id')
  @Permissions('seo.worklog.read')
  @ApiOperation({ summary: 'Get details of a daily work log' })
  @ApiResponse({ type: SuccessResponseDto })
  async getOne(@Param('id') id: string, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.getWorkLog(tenantId, id);
    return { message: 'SEO Daily Work Log detail retrieved', data };
  }

  @Patch(':id')
  @Permissions('seo.worklog.manage')
  @ApiOperation({
    summary: 'Update daily work log details (Draft or Revision Required only)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSEODailyWorkLogDto,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.service.updateWorkLog(tenantId, id, dto);
    return { message: 'SEO Daily Work Log updated successfully', data };
  }

  @Post(':id/review')
  @Permissions('seo.review')
  @ApiOperation({ summary: 'Approve, reject or request revision on work log' })
  @ApiResponse({ type: SuccessResponseDto })
  async review(
    @Param('id') id: string,
    @Body() dto: ReviewSEODailyWorkLogDto,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const user = (req as any).user;
    const data = await this.service.reviewWorkLog(
      tenantId,
      user?.id || 'system',
      id,
      dto,
    );
    return { message: 'SEO Daily Work Log reviewed successfully', data };
  }

  @Post(':id/proof')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @Permissions('seo.worklog.manage')
  @ApiOperation({ summary: 'Upload work screenshot proof' })
  @ApiResponse({ type: SuccessResponseDto })
  async uploadProof(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: Request,
  ) {
    const tenantId = this.getTenantId(req);
    const fileBuffer = file?.buffer || Buffer.alloc(0);
    const fileName = file?.originalname || 'screenshot.png';
    const mimeType = file?.mimetype || 'image/png';

    const data = await this.service.uploadWorkProof(
      tenantId,
      id,
      fileBuffer,
      fileName,
      mimeType,
    );
    return { message: 'SEO work log proof file uploaded successfully', data };
  }
}
