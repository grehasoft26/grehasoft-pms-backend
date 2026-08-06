import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientCategoriesService } from './client-categories.service';
import { CreateClientCategoryDto, UpdateClientCategoryDto } from './dto/client-categories.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Client Categories')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('client-categories')
export class ClientCategoriesController {
  constructor(private readonly categoriesService: ClientCategoriesService) {}

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
  @Permissions('client-categories.create')
  @ApiOperation({ summary: 'Create a new client category' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateClientCategoryDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.categoriesService.create(dto, context);
    return { message: 'Client category created successfully', data };
  }

  @Get()
  @Permissions('client-categories.read')
  @ApiOperation({ summary: 'Get all client categories' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.categoriesService.getMany();
    return { message: 'Client categories retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('client-categories.read')
  @ApiOperation({ summary: 'Get specific client category by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.categoriesService.getById(id);
    return { message: 'Client category retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('client-categories.update')
  @ApiOperation({ summary: 'Update client category configurations' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateClientCategoryDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.categoriesService.update(id, dto, context);
    return { message: 'Client category updated successfully', data };
  }

  @Delete(':id')
  @Permissions('client-categories.delete')
  @ApiOperation({ summary: 'Delete client category' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.categoriesService.delete(id, context);
    return { message: 'Client category deleted successfully' };
  }
}
