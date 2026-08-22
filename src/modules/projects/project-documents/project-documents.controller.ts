import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProjectDocumentsService } from './project-documents.service';
import { CreateProjectDocumentDto } from './dto/project-documents.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Documents')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-documents')
export class ProjectDocumentsController {
  constructor(private readonly documentsService: ProjectDocumentsService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @Permissions('project-documents.upload')
  @ApiOperation({ summary: 'Register project document metadata' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProjectDocumentDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.documentsService.create(dto, context);
    return { message: 'Document registered successfully', data };
  }

  @Get()
  @Permissions('project-documents.read')
  @ApiOperation({ summary: 'List project documents' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId: string) {
    const data = await this.documentsService.getMany(projectId);
    return { message: 'Documents retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('project-documents.read')
  @ApiOperation({ summary: 'Get project document metadata' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.documentsService.getById(id);
    return { message: 'Document retrieved successfully', data };
  }

  @Get(':id/download')
  @Permissions('project-documents.read')
  @ApiOperation({ summary: 'Download project document file' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.getById(id);
    const fileStream = await this.documentsService.getFileStream(id);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
    fileStream.pipe(res);
  }

  @Delete(':id')
  @Permissions('project-documents.delete')
  @ApiOperation({ summary: 'Delete project document' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.documentsService.delete(id, context);
    return { message: 'Document deleted successfully' };
  }
}
