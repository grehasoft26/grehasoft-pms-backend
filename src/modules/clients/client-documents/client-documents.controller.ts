import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClientDocumentsService } from './client-documents.service';
import {
  CreateClientDocumentDto,
  UpdateClientDocumentDto,
} from './dto/client-documents.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Client Documents')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('client-documents')
export class ClientDocumentsController {
  constructor(private readonly documentsService: ClientDocumentsService) {}

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
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @Permissions('client-documents.create')
  @ApiOperation({ summary: 'Upload a document for a client' })
  @ApiResponse({ type: SuccessResponseDto })
  async upload(
    @UploadedFile() file: any,
    @Body() dto: CreateClientDocumentDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const fileBuffer = file?.buffer || Buffer.alloc(0);
    const fileName = file?.originalname || 'document.pdf';
    const mimeType = file?.mimetype || 'application/pdf';
    const fileSize = file?.size || 0;

    const data = await this.documentsService.uploadDocument(
      dto,
      fileBuffer,
      fileName,
      mimeType,
      fileSize,
      context,
    );
    return { message: 'Client document uploaded successfully', data };
  }

  @Get()
  @Permissions('client-documents.read')
  @ApiOperation({
    summary:
      'Get all client documents metadata, optionally filtered by clientId',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('clientId') clientId?: string) {
    const data = await this.documentsService.getMany(clientId);
    return { message: 'Client documents retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('client-documents.read')
  @ApiOperation({ summary: 'Get client document metadata by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.documentsService.getById(id);
    return { message: 'Client document metadata retrieved successfully', data };
  }

  @Get(':id/download')
  @Permissions('client-documents.read')
  @ApiOperation({ summary: 'Download the physical document file' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.getById(id);
    const fileStream = await this.documentsService.getFileStream(id);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.fileName}"`,
    );
    fileStream.pipe(res);
  }

  @Patch(':id')
  @Permissions('client-documents.update')
  @ApiOperation({ summary: 'Update client document metadata' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDocumentDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.documentsService.update(id, dto, context);
    return { message: 'Client document metadata updated successfully', data };
  }

  @Delete(':id')
  @Permissions('client-documents.delete')
  @ApiOperation({
    summary: 'Soft delete a client document and purge physical storage file',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.documentsService.delete(id, context);
    return { message: 'Client document deleted successfully' };
  }
}
