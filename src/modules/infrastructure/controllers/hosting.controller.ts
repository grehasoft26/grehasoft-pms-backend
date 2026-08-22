import {
  Body,
  Controller,
  Get,
  Param,
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
import { HostingService } from '../services/hosting.service';
import {
  CreateHostingPlanDto,
  CreateHostingAccountDto,
} from '../dto/hosting.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('DevOps Hosting')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('infrastructure/hosting')
export class HostingController {
  constructor(private readonly service: HostingService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('plans')
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Create a hosting plan' })
  @ApiResponse({ type: SuccessResponseDto })
  async createPlan(@Body() dto: CreateHostingPlanDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createPlan(dto, context);
    return { message: 'Hosting plan defined successfully', data };
  }

  @Get('plans')
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get list of hosting plans' })
  @ApiResponse({ type: SuccessResponseDto })
  async getPlans() {
    const data = await this.service.getPlans();
    return { message: 'Hosting plans retrieved', data };
  }

  @Post('accounts')
  @Permissions('infrastructure.manage')
  @ApiOperation({
    summary: 'Create a client hosting account (Disk limits, bandwidth limits)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async createAccount(
    @Body() dto: CreateHostingAccountDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.createAccount(dto, context);
    return { message: 'Hosting account created successfully', data };
  }

  @Get('accounts')
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get list of hosting accounts' })
  @ApiResponse({ type: SuccessResponseDto })
  async getAccounts(
    @Query('clientId') clientId?: string,
    @Query('projectId') projectId?: string,
  ) {
    const data = await this.service.getAccounts(clientId, projectId);
    return { message: 'Hosting accounts list retrieved', data };
  }

  @Get('accounts/:id')
  @Permissions('infrastructure.read')
  @ApiOperation({
    summary: 'Get hosting account details with plans & credentials',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getAccount(@Param('id') id: string) {
    const data = await this.service.getAccount(id);
    return { message: 'Hosting account details retrieved', data };
  }
}
