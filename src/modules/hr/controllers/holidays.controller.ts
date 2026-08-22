import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HolidaysService } from '../services/holidays.service';
import { CreateHolidayDto } from '../dto/holidays.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('HR Holidays')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/holidays')
export class HolidaysController {
  constructor(private readonly service: HolidaysService) {}

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
  @ApiOperation({
    summary: 'Configure Holiday (National, Company, Regional, Optional)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateHolidayDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createHoliday(dto, context);
    return { message: 'Holiday configured successfully', data };
  }

  @Get()
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get holiday calendar' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.service.getHolidays();
    return { message: 'Holiday calendar list', data };
  }
}
