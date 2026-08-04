import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/departments.dto';
import { Status } from '@prisma/client';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  private getContext(req: Request): RequestContext {
    return {
      userId: (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateDepartmentDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.departmentsService.create(dto, context);
    return { message: 'Department created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments with tree structure' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.departmentsService.getMany();
    return { message: 'Departments retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific department by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.departmentsService.getById(id);
    return { message: 'Department retrieved successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update department configurations' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.departmentsService.update(id, dto, context);
    return { message: 'Department updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a department' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.departmentsService.delete(id, context);
    return { message: 'Department soft-deleted successfully' };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted department' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.departmentsService.restore(id, context);
    return { message: 'Department restored successfully', data };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a department' })
  @ApiResponse({ type: SuccessResponseDto })
  async activate(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.departmentsService.setStatus(id, Status.ACTIVE, context);
    return { message: 'Department activated successfully', data };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a department' })
  @ApiResponse({ type: SuccessResponseDto })
  async deactivate(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.departmentsService.setStatus(id, Status.INACTIVE, context);
    return { message: 'Department deactivated successfully', data };
  }
}
