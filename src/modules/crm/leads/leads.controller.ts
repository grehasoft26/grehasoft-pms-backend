import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto, AssignLeadDto, MergeLeadsDto } from './dto/leads.dto';
import { CreateLeadActivityDto, UpdateLeadActivityDto } from '../lead-activities/dto/lead-activities.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Leads')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

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
  @Permissions('leads.create')
  @ApiOperation({ summary: 'Create a new Lead' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateLeadDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.leadsService.create(dto, context);
    return { message: 'Lead created successfully', data };
  }

  @Get()
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Get all Leads with advanced search, filter, and pagination' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query() query: LeadFilterDto) {
    const { data, totalCount } = await this.leadsService.getMany(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Leads retrieved successfully',
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

  @Get('check-duplicates')
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Check for duplicate leads using Email, Phone, Company Name, or GST Number' })
  @ApiResponse({ type: SuccessResponseDto })
  async checkDuplicates(
    @Query('email') email?: string,
    @Query('phone') phone?: string,
    @Query('companyName') companyName?: string,
    @Query('gstNumber') gstNumber?: string,
    @Query('excludeId') excludeId?: string
  ) {
    const duplicates = await this.leadsService.checkDuplicates({
      email,
      phone,
      companyName,
      gstNumber,
      excludeId,
    });
    return { message: 'Duplicate check executed successfully', duplicates };
  }

  @Post('merge')
  @Permissions('leads.merge')
  @ApiOperation({ summary: 'Merge duplicate leads' })
  @ApiResponse({ type: SuccessResponseDto })
  async merge(@Body() dto: MergeLeadsDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.leadsService.merge(dto, context);
    return { message: 'Leads merged successfully', data };
  }

  @Get(':id')
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Get specific Lead details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.leadsService.getById(id);
    return { message: 'Lead details retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('leads.update')
  @ApiOperation({ summary: 'Update Lead details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.leadsService.update(id, dto, context);
    return { message: 'Lead updated successfully', data };
  }

  @Delete(':id')
  @Permissions('leads.delete')
  @ApiOperation({ summary: 'Soft delete a Lead' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.leadsService.delete(id, context);
    return { message: 'Lead soft-deleted successfully' };
  }

  @Post(':id/restore')
  @Permissions('leads.restore')
  @ApiOperation({ summary: 'Restore soft-deleted Lead' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.leadsService.restore(id, context);
    return { message: 'Lead restored successfully', data };
  }

  @Post(':id/assign')
  @Permissions('leads.assign')
  @ApiOperation({ summary: 'Assign Lead owner / Transfer lead' })
  @ApiResponse({ type: SuccessResponseDto })
  async assign(@Param('id') id: string, @Body() dto: AssignLeadDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.leadsService.assign(id, dto, context);
    return { message: 'Lead ownership assigned successfully', data };
  }

  @Get(':id/timeline')
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Retrieve Lead timeline logs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTimeline(@Param('id') id: string) {
    const data = await this.leadsService.getTimeline(id);
    return { message: 'Lead timeline logs retrieved successfully', data };
  }

  // Lead Activities Endpoints
  @Post(':id/activities')
  @Permissions('leads.update')
  @ApiOperation({ summary: 'Record a Lead activity (Call, Email, WhatsApp, etc.)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createActivity(
    @Param('id') leadId: string,
    @Body() dto: CreateLeadActivityDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    dto.leadId = leadId; // Ensure parameter binds correctly
    const data = await this.leadsService.createActivity(dto, context);
    return { message: 'Lead activity recorded successfully', data };
  }

  @Get(':id/activities')
  @Permissions('leads.read')
  @ApiOperation({ summary: 'Get activities for a lead' })
  @ApiResponse({ type: SuccessResponseDto })
  async getActivities(@Param('id') leadId: string) {
    const data = await this.leadsService.getActivities(leadId);
    return { message: 'Lead activities retrieved successfully', data };
  }

  @Patch('activities/:activityId')
  @Permissions('leads.update')
  @ApiOperation({ summary: 'Update recorded activity' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateActivity(
    @Param('activityId') activityId: string,
    @Body() dto: UpdateLeadActivityDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.leadsService.updateActivity(activityId, dto, context);
    return { message: 'Lead activity updated successfully', data };
  }

  @Delete('activities/:activityId')
  @Permissions('leads.update')
  @ApiOperation({ summary: 'Delete recorded activity' })
  @ApiResponse({ type: SuccessResponseDto })
  async deleteActivity(@Param('activityId') activityId: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.leadsService.deleteActivity(activityId, context);
    return { message: 'Lead activity deleted successfully' };
  }
}
