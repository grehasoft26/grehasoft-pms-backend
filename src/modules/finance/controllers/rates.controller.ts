import {
  Body,
  Controller,
  Get,
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
import { BillableRatesService } from '../services/billable-rates.service';
import { CreateBillableRateDto } from '../dto/rates.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Finance Billable Rates')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('finance/billable-rates')
export class RatesController {
  constructor(private readonly service: BillableRatesService) {}

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
  @Permissions('billing.rates')
  @ApiOperation({
    summary:
      'Setup a billable rate for employee, project, task, client or department',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateBillableRateDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createRate(dto, context);
    return { message: 'Billable rate defined successfully', data };
  }

  @Get()
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get all billable rates configs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.service.getRates();
    return { message: 'Billable rates retrieved', data };
  }

  @Get('resolve')
  @Permissions('finance.read')
  @ApiOperation({
    summary:
      'Resolve effective billable rate using fallback chain lookup rules',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async resolve(
    @Query('taskId') taskId?: string,
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('clientId') clientId?: string,
    @Query('targetCurrencyId') targetCurrencyId?: string,
  ) {
    const data = await this.service.resolveEffectiveRate({
      taskId,
      userId,
      projectId,
      departmentId,
      clientId,
      targetCurrencyId,
    });
    return { message: 'Effective billable rate resolved', data };
  }
}
