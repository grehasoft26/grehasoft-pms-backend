import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeadSourcesService } from './lead-sources.service';
import { CreateLeadSourceDto, UpdateLeadSourceDto } from './dto/lead-sources.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Lead Sources')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('lead-sources')
export class LeadSourcesController {
  constructor(private readonly sourcesService: LeadSourcesService) {}

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
  @Permissions('leads.update')
  @ApiOperation({ summary: 'Create a custom lead source' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateLeadSourceDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.sourcesService.create(dto, context);
    return { message: 'Lead source created successfully', data };
  }

  @Get()
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Get all lead sources' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.sourcesService.getMany();
    return { message: 'Lead sources retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Get specific lead source' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.sourcesService.getById(id);
    return { message: 'Lead source retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('leads.update')
  @ApiOperation({ summary: 'Update custom lead source details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateLeadSourceDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.sourcesService.update(id, dto, context);
    return { message: 'Lead source updated successfully', data };
  }

  @Delete(':id')
  @Permissions('leads.update')
  @ApiOperation({ summary: 'Delete custom lead source' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.sourcesService.delete(id, context);
    return { message: 'Lead source deleted successfully' };
  }
}
