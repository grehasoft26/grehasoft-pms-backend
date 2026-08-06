import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientNotesService } from './client-notes.service';
import { CreateClientNoteDto, UpdateClientNoteDto } from './dto/client-notes.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Client Notes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('client-notes')
export class ClientNotesController {
  constructor(private readonly notesService: ClientNotesService) {}

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
  @Permissions('client-notes.create')
  @ApiOperation({ summary: 'Create a new note for a client' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateClientNoteDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.notesService.create(dto, context);
    return { message: 'Client note created successfully', data };
  }

  @Get()
  @Permissions('client-notes.read')
  @ApiOperation({ summary: 'Get all client notes, optionally filtered by clientId' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('clientId') clientId?: string) {
    const data = await this.notesService.getMany(clientId);
    return { message: 'Client notes retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('client-notes.read')
  @ApiOperation({ summary: 'Get specific client note by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.notesService.getById(id);
    return { message: 'Client note retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('client-notes.update')
  @ApiOperation({ summary: 'Update client note details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateClientNoteDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.notesService.update(id, dto, context);
    return { message: 'Client note updated successfully', data };
  }

  @Delete(':id')
  @Permissions('client-notes.delete')
  @ApiOperation({ summary: 'Soft delete a client note' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.notesService.delete(id, context);
    return { message: 'Client note deleted successfully' };
  }
}
