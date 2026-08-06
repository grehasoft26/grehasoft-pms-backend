import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExpensesService } from '../services/expenses.service';
import { CreateExpenseDto, UpdateExpenseStatusDto } from '../dto/expenses.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ExpenseStatus } from '@prisma/client';

@ApiTags('Finance Expenses')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('finance/expenses')
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

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
  @ApiOperation({ summary: 'Log employee, project, or vendor expense (Draft)' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateExpenseDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createExpense(dto, context);
    return { message: 'Expense logged successfully', data };
  }

  @Patch(':id/status')
  @Permissions('expenses.approve')
  @ApiOperation({ summary: 'Update expense status (Draft → Submitted → Manager Approved → Finance Approved → Paid / Rejected)' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseStatusDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.updateStatus(id, dto.status, context);
    return { message: `Expense status updated to ${dto.status}`, data };
  }

  @Get()
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get list of expenses with filters' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(
    @Query('projectId') projectId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: ExpenseStatus
  ) {
    const data = await this.service.getExpenses({ projectId, userId, status });
    return { message: 'Expenses list retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get specific expense details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getExpenseById(id);
    return { message: 'Expense details retrieved', data };
  }
}
