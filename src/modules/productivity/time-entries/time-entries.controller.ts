import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/time-entries.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Time Entries')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly service: TimeEntriesService) {}

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
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Create manual TimeEntry record (Single Source of Truth)' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateTimeEntryDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.create(dto, context);
    return { message: 'TimeEntry created successfully', data };
  }

  @Get()
  @Permissions('timetracking.read')
  @ApiOperation({ summary: 'Get list of TimeEntry logs with filters' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('taskId') taskId?: string,
    @Query('approved') approved?: boolean
  ) {
    const data = await this.service.getMany({ userId, projectId, taskId, approved });
    return { message: 'TimeEntries retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('timetracking.read')
  @ApiOperation({ summary: 'Get specific TimeEntry details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id);
    return { message: 'TimeEntry retrieved', data };
  }

  @Patch(':id')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Update TimeEntry details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTimeEntryDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.update(id, dto, context);
    return { message: 'TimeEntry updated successfully', data };
  }

  @Delete(':id')
  @Permissions('timetracking.manage')
  @ApiOperation({ summary: 'Delete TimeEntry record' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.service.delete(id, context);
    return { message: 'TimeEntry deleted successfully' };
  }
}
