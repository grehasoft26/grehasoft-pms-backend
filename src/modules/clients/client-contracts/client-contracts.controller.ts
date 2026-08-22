import {
  Body,
  Controller,
  Delete,
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
import { ClientContractsService } from './client-contracts.service';
import {
  CreateClientContractDto,
  UpdateClientContractDto,
} from './dto/client-contracts.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Client Contracts')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('client-contracts')
export class ClientContractsController {
  constructor(private readonly contractsService: ClientContractsService) {}

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
  @Permissions('client-contracts.create')
  @ApiOperation({ summary: 'Create a new client contract' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateClientContractDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.contractsService.create(dto, context);
    return { message: 'Client contract created successfully', data };
  }

  @Get()
  @Permissions('client-contracts.read')
  @ApiOperation({
    summary: 'Get all client contracts, optionally filtered by clientId',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('clientId') clientId?: string) {
    const data = await this.contractsService.getMany(clientId);
    return { message: 'Client contracts retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('client-contracts.read')
  @ApiOperation({ summary: 'Get specific client contract by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.contractsService.getById(id);
    return { message: 'Client contract retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('client-contracts.update')
  @ApiOperation({ summary: 'Update client contract details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientContractDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.contractsService.update(id, dto, context);
    return { message: 'Client contract updated successfully', data };
  }

  @Delete(':id')
  @Permissions('client-contracts.delete')
  @ApiOperation({ summary: 'Soft delete a client contract' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.contractsService.delete(id, context);
    return { message: 'Client contract deleted successfully' };
  }
}
