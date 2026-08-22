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
import { VendorsService } from '../services/vendors.service';
import { CreateVendorDto } from '../dto/vendors.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Finance Vendors')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('finance/vendors')
export class VendorsController {
  constructor(private readonly service: VendorsService) {}

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
  @ApiOperation({ summary: 'Create vendor profile' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateVendorDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createVendor(dto, context);
    return { message: 'Vendor profile created successfully', data };
  }

  @Get()
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get list of active vendors' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.service.getVendors();
    return { message: 'Vendors list retrieved', data };
  }

  @Get(':id')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Get specific vendor profile details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getVendorById(id);
    return { message: 'Vendor details retrieved', data };
  }
}
