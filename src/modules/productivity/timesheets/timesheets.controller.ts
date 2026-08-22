import {
  Body,
  Controller,
  Get,
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
import { TimesheetApprovalService } from './timesheet-approval.service';
import { SubmitTimesheetDto, ApproveTimesheetDto } from './dto/timesheets.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Timesheets Workflows')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly service: TimesheetApprovalService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as Request & { user?: { id: string } }).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('submit')
  @Permissions('timesheets.submit')
  @ApiOperation({
    summary: 'Submit weekly timesheet for approval (DRAFT -> SUBMITTED)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async submitTimesheet(@Body() dto: SubmitTimesheetDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.submitTimesheet(
      context.userId,
      dto.startDate,
      context,
    );
    return { message: 'Weekly timesheet submitted successfully', data };
  }

  @Patch(':id/approve')
  @Permissions('timesheets.approve')
  @ApiOperation({
    summary:
      'Approve or Reject weekly timesheet (SUBMITTED -> MANAGER_APPROVED -> FINANCE_APPROVED / REJECTED)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async approveTimesheet(
    @Param('id') id: string,
    @Body() dto: ApproveTimesheetDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.approveTimesheet(
      id,
      dto.status,
      dto.comments || '',
      context,
    );
    return { message: `Timesheet state updated to ${dto.status}`, data };
  }

  @Get('pending')
  @Permissions('timesheets.approve')
  @ApiOperation({
    summary: 'Get list of pending weekly timesheets awaiting approval',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getPending() {
    const data = await this.service.getPendingApprovals();
    return { message: 'Pending timesheets retrieved', data };
  }

  @Get(':id')
  @Permissions('timetracking.read')
  @ApiOperation({
    summary: 'Get specific weekly timesheet details and approval history log',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getTimesheetById(id);
    return { message: 'Weekly timesheet retrieved', data };
  }

  @Get()
  @Permissions('timetracking.read')
  @ApiOperation({ summary: 'Get timesheet by userId and startDate' })
  @ApiResponse({ type: SuccessResponseDto })
  async getWeekly(
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
  ) {
    const data = await this.service.getWeekly(userId, startDate);
    return { message: 'Weekly timesheet retrieved', data };
  }
}
