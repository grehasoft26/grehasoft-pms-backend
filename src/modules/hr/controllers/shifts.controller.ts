import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ShiftsService } from '../services/shifts.service';
import { CreateShiftDto, AssignShiftDto } from '../dto/shifts.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('HR Shifts & Scheduling')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/shifts')
export class ShiftsController {
  constructor(private readonly service: ShiftsService) {}

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
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Create shift configuration (General, Morning, Evening, Night, Grace periods)' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateShiftDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createShift(dto, context);
    return { message: 'Shift configuration defined successfully', data };
  }

  @Post('assignments/:profileId')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Assign shift to employee' })
  @ApiResponse({ type: SuccessResponseDto })
  async assign(
    @Param('profileId') profileId: string,
    @Body() dto: AssignShiftDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.assignShift(profileId, dto, context);
    return { message: 'Shift assigned successfully', data };
  }

  @Get()
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get list of shifts' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.service.getShifts();
    return { message: 'Shifts list', data };
  }

  @Get('assignment/:profileId')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get effective shift assigned to employee on a specific date' })
  @ApiResponse({ type: SuccessResponseDto })
  async getAssignment(@Param('profileId') profileId: string, @Query('date') date?: string) {
    const data = await this.service.getShiftAssignment(profileId, date);
    return { message: 'Effective shift assignment details', data };
  }
}
