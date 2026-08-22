import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { LeadStatusesService } from './lead-statuses.service';
import {
  CreateLeadStatusDto,
  UpdateLeadStatusDto,
} from './dto/lead-statuses.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Lead Statuses')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('lead-statuses')
export class LeadStatusesController {
  constructor(private readonly statusesService: LeadStatusesService) {}

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
  @ApiOperation({ summary: 'Create a custom lead status' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateLeadStatusDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.statusesService.create(dto, context);
    return { message: 'Lead status created successfully', data };
  }

  @Get()
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Get all lead statuses' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.statusesService.getMany();
    return { message: 'Lead statuses retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Get specific lead status' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.statusesService.getById(id);
    return { message: 'Lead status retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('leads.update')
  @ApiOperation({ summary: 'Update custom lead status details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.statusesService.update(id, dto, context);
    return { message: 'Lead status updated successfully', data };
  }

  @Delete(':id')
  @Permissions('leads.update')
  @ApiOperation({ summary: 'Delete custom lead status' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.statusesService.delete(id, context);
    return { message: 'Lead status deleted successfully' };
  }
}
