import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InvoicesService } from '../services/invoices.service';
import { CreateInvoiceDto, GenerateTimeEntryInvoiceDto, AddPaymentDto } from '../dto/invoices.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Finance Invoices')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('finance/invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

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
  @ApiOperation({ summary: 'Create a new invoice manual (Draft)' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateInvoiceDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createInvoice(dto, context);
    return { message: 'Invoice created successfully', data };
  }

  @Patch(':id/send')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Finalize invoice and mark as Sent (posts AR & Revenue entries to accounting ledger)' })
  @ApiResponse({ type: SuccessResponseDto })
  async markAsSent(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.markAsSent(id, context);
    return { message: 'Invoice finalized and sent', data };
  }

  @Post('generate-from-time')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Generate Invoice directly from approved TimeEntries (prevents duplicate billing)' })
  @ApiResponse({ type: SuccessResponseDto })
  async generateFromTime(@Body() dto: GenerateTimeEntryInvoiceDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.generateFromTimeEntries(dto, context);
    return { message: 'Invoice generated from time entries successfully', data };
  }

  @Post('payments/allocate')
  @Permissions('finance.manage')
  @ApiOperation({ summary: 'Apply client payments and allocate across one or multiple invoices' })
  @ApiResponse({ type: SuccessResponseDto })
  async allocatePayment(@Body() dto: AddPaymentDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.allocatePayment(dto, context);
    return { message: 'Payment allocated successfully', data };
  }

  @Get()
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get list of invoices with filters' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(
    @Query('clientId') clientId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: InvoiceStatus
  ) {
    const data = await this.service.getInvoices({ clientId, projectId, status });
    return { message: 'Invoices retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get invoice details including items, payments, timelines, credit/debit notes' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getInvoiceById(id);
    return { message: 'Invoice details retrieved', data };
  }
}
