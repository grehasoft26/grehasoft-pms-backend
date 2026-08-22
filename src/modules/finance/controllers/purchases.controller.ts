import {
  Body,
  Controller,
  Get,
  Param,
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
import { PurchasesService } from '../services/purchases.service';
import { CreatePurchaseDto } from '../dto/purchases.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Finance Purchases')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('finance/purchases')
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

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
  @ApiOperation({ summary: 'Create purchase order (PO)' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreatePurchaseDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createPurchase(dto, context);
    return { message: 'Purchase Order created successfully', data };
  }

  @Get()
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.service.getPurchases();
    return { message: 'Purchases list retrieved', data };
  }

  @Get(':id')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get specific purchase order details and items' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getPurchaseById(id);
    return { message: 'Purchase details retrieved', data };
  }
}
