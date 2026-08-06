import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeavesService } from '../services/leaves.service';
import { CreateLeaveRequestDto, CreateLeaveApprovalDto, CreateLeaveTypeDto } from '../dto/leaves.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { LeaveStatus } from '@prisma/client';

@ApiTags('HR Leaves')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/leaves')
export class LeavesController {
  constructor(private readonly service: LeavesService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('types')
  @Permissions('leave.manage')
  @ApiOperation({ summary: 'Setup new Leave Type configuration' })
  @ApiResponse({ type: SuccessResponseDto })
  async createType(@Body() dto: CreateLeaveTypeDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createLeaveType(dto, context);
    return { message: 'Leave type created successfully', data };
  }

  @Get('types')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get list of defined leave types' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTypes() {
    const data = await this.service.findLeaveTypes();
    return { message: 'Leave types list', data };
  }

  @Post('requests/:profileId')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Submit leave request (validates balance, blackout dates, half day and hourly limits)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createRequest(
    @Param('profileId') profileId: string,
    @Body() dto: CreateLeaveRequestDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.createRequest(profileId, dto, context);
    return { message: 'Leave request submitted successfully', data };
  }

  @Patch('requests/:id/approve')
  @Permissions('leave.approve')
  @ApiOperation({ summary: 'Approve or Reject leave request (Submits to workflow balance updates)' })
  @ApiResponse({ type: SuccessResponseDto })
  async approveRequest(
    @Param('id') id: string,
    @Body() dto: CreateLeaveApprovalDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.approveRequest(id, dto, context);
    return { message: `Leave request status updated to ${dto.status}`, data };
  }

  @Post('blackouts')
  @Permissions('leave.manage')
  @ApiOperation({ summary: 'Define leave blackout period dates restriction' })
  @ApiResponse({ type: SuccessResponseDto })
  async createBlackout(
    @Body('name') name: string,
    @Body('startDate') start: string,
    @Body('endDate') end: string,
    @Body('description') desc?: string
  ) {
    const data = await this.service.createBlackoutDate(name, start, end, desc);
    return { message: 'Leave blackout date configured', data };
  }

  @Get('requests')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get leave requests list with filters' })
  @ApiResponse({ type: SuccessResponseDto })
  async getRequests(@Query('status') status?: LeaveStatus, @Query('profileId') profileId?: string) {
    const data = await this.service.getLeaveRequests({ status, employeeProfileId: profileId });
    return { message: 'Leave requests list retrieved', data };
  }

  @Get('requests/:id')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get specific leave request details and approvals timeline' })
  @ApiResponse({ type: SuccessResponseDto })
  async getRequestById(@Param('id') id: string) {
    const data = await this.service.getLeaveRequestById(id);
    return { message: 'Leave request details', data };
  }
}
