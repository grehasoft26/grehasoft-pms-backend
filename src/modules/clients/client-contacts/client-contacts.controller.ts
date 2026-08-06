import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientContactsService } from './client-contacts.service';
import { CreateClientContactDto, UpdateClientContactDto } from './dto/client-contacts.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Client Contacts')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('client-contacts')
export class ClientContactsController {
  constructor(private readonly contactsService: ClientContactsService) {}

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
  @Permissions('client-contacts.create')
  @ApiOperation({ summary: 'Create a new contact for a client' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateClientContactDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.contactsService.create(dto, context);
    return { message: 'Client contact created successfully', data };
  }

  @Get()
  @Permissions('client-contacts.read')
  @ApiOperation({ summary: 'Get all client contacts, optionally filtered by clientId' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('clientId') clientId?: string) {
    const data = await this.contactsService.getMany(clientId);
    return { message: 'Client contacts retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('client-contacts.read')
  @ApiOperation({ summary: 'Get specific client contact by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.contactsService.getById(id);
    return { message: 'Client contact retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('client-contacts.update')
  @ApiOperation({ summary: 'Update client contact details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateClientContactDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.contactsService.update(id, dto, context);
    return { message: 'Client contact updated successfully', data };
  }

  @Delete(':id')
  @Permissions('client-contacts.delete')
  @ApiOperation({ summary: 'Soft delete a client contact' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.contactsService.delete(id, context);
    return { message: 'Client contact deleted successfully' };
  }
}
