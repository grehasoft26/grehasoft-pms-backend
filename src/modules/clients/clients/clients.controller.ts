import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
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
import { ClientsService } from './clients.service';
import { ClientTimelinesService } from '../client-timelines/client-timelines.service';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientFilterDto,
} from './dto/clients.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ClientStatus } from '@prisma/client';

@ApiTags('Clients')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly timelineService: ClientTimelinesService,
  ) {}

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
  @Permissions('clients.create')
  @ApiOperation({ summary: 'Create a new client with auto-generated code' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateClientDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.clientsService.create(dto, context);
    return { message: 'Client created successfully', data };
  }

  @Get()
  @Permissions('clients.read')
  @ApiOperation({
    summary: 'Get all clients with advanced search, filter, and pagination',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query() query: ClientFilterDto) {
    const { data, totalCount } = await this.clientsService.getMany(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Clients retrieved successfully',
      data,
      meta: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  @Get(':id')
  @Permissions('clients.read')
  @ApiOperation({ summary: 'Get specific client profile by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.clientsService.getById(id);
    return { message: 'Client retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('clients.update')
  @ApiOperation({ summary: 'Update client details and preferences' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.clientsService.update(id, dto, context);
    return { message: 'Client updated successfully', data };
  }

  @Delete(':id')
  @Permissions('clients.delete')
  @ApiOperation({ summary: 'Soft delete a client' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.clientsService.delete(id, context);
    return { message: 'Client soft-deleted successfully' };
  }

  @Post(':id/restore')
  @Permissions('clients.restore')
  @ApiOperation({ summary: 'Restore a soft-deleted client' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.clientsService.restore(id, context);
    return { message: 'Client restored successfully', data };
  }

  @Patch(':id/status')
  @Permissions('clients.update')
  @ApiOperation({ summary: 'Update client status' })
  @ApiResponse({ type: SuccessResponseDto })
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: ClientStatus,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.clientsService.setStatus(id, status, context);
    return { message: `Client status updated to ${status} successfully`, data };
  }

  @Get(':id/timeline')
  @Permissions('clients.read')
  @ApiOperation({ summary: 'Retrieve client timeline history' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTimeline(@Param('id') id: string) {
    const data = await this.timelineService.getMany(id);
    return { message: 'Client timeline history retrieved successfully', data };
  }
}
