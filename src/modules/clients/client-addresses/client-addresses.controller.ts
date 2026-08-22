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
import { ClientAddressesService } from './client-addresses.service';
import {
  CreateClientAddressDto,
  UpdateClientAddressDto,
} from './dto/client-addresses.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Client Addresses')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('client-addresses')
export class ClientAddressesController {
  constructor(private readonly addressesService: ClientAddressesService) {}

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
  @Permissions('client-addresses.create')
  @ApiOperation({ summary: 'Create a new address for a client' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateClientAddressDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.addressesService.create(dto, context);
    return { message: 'Client address created successfully', data };
  }

  @Get()
  @Permissions('client-addresses.read')
  @ApiOperation({
    summary: 'Get all client addresses, optionally filtered by clientId',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('clientId') clientId?: string) {
    const data = await this.addressesService.getMany(clientId);
    return { message: 'Client addresses retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('client-addresses.read')
  @ApiOperation({ summary: 'Get specific client address by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.addressesService.getById(id);
    return { message: 'Client address retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('client-addresses.update')
  @ApiOperation({ summary: 'Update client address details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientAddressDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.addressesService.update(id, dto, context);
    return { message: 'Client address updated successfully', data };
  }

  @Delete(':id')
  @Permissions('client-addresses.delete')
  @ApiOperation({ summary: 'Soft delete a client address' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.addressesService.delete(id, context);
    return { message: 'Client address deleted successfully' };
  }
}
