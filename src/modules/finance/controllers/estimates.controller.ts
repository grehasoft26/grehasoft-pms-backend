import {
  Body,
  Controller,
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
import { EstimatesService } from '../services/estimates.service';
import { CreateEstimateDto } from '../dto/estimates.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { EstimateStatus } from '@prisma/client';

@ApiTags('Finance Estimates')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('finance/estimates')
export class EstimatesController {
  constructor(private readonly service: EstimatesService) {}

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
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Create a new Estimate / quotation (Draft)' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateEstimateDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createEstimate(dto, context);
    return { message: 'Estimate created successfully', data };
  }

  @Patch(':id/status')
  @Permissions('finance.manage')
  @ApiOperation({
    summary: 'Update Estimate status (SENT, ACCEPTED, DECLINED, EXPIRED)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: EstimateStatus,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.updateStatus(id, status, context);
    return { message: 'Estimate status updated', data };
  }

  @Get()
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get all Estimates' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.service.getEstimates();
    return { message: 'Estimates retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get Estimate details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getEstimateById(id);
    return { message: 'Estimate details retrieved', data };
  }
}
