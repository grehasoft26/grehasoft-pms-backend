import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DesignationsService } from './designations.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designations.dto';
import { Status } from '@prisma/client';

@ApiTags('Designations')
@Controller('designations')
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  private getContext(req: Request): RequestContext {
    return {
      userId: (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new designation' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateDesignationDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.designationsService.create(dto, context);
    return { message: 'Designation created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all designations list' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.designationsService.getMany();
    return { message: 'Designations retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific designation by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.designationsService.getById(id);
    return { message: 'Designation retrieved successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update designation details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateDesignationDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.designationsService.update(id, dto, context);
    return { message: 'Designation updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a designation' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.designationsService.delete(id, context);
    return { message: 'Designation soft-deleted successfully' };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted designation' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.designationsService.restore(id, context);
    return { message: 'Designation restored successfully', data };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a designation' })
  @ApiResponse({ type: SuccessResponseDto })
  async activate(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.designationsService.setStatus(id, Status.ACTIVE, context);
    return { message: 'Designation activated successfully', data };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a designation' })
  @ApiResponse({ type: SuccessResponseDto })
  async deactivate(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.designationsService.setStatus(id, Status.INACTIVE, context);
    return { message: 'Designation deactivated successfully', data };
  }
}
