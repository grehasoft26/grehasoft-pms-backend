import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { DomainsService } from '../services/domains.service';
import { RegisterDomainDto, CreateDnsRecordDto } from '../dto/domains.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('DevOps Domains')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('infrastructure/domains')
export class DomainsController {
  constructor(private readonly service: DomainsService) {}

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
  @Permissions('domains.manage')
  @ApiOperation({
    summary: 'Register a new domain name (auto-renew, cost, WHOIS nameservers)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async register(@Body() dto: RegisterDomainDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.registerDomain(dto, context);
    return { message: 'Domain registered successfully', data };
  }

  @Get()
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get list of domains' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('clientId') clientId?: string) {
    const data = await this.service.getDomains(clientId);
    return { message: 'Domains list retrieved', data };
  }

  @Get(':id')
  @Permissions('infrastructure.read')
  @ApiOperation({
    summary: 'Get domain details with DNS records and SSL certificates',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getDomain(id);
    return { message: 'Domain details retrieved', data };
  }

  @Put(':id')
  @Permissions('domains.manage')
  @ApiOperation({ summary: 'Update domain registry settings' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: RegisterDomainDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.updateDomain(id, dto, context);
    return { message: 'Domain updated successfully', data };
  }

  @Delete(':id')
  @Permissions('domains.manage')
  @ApiOperation({ summary: 'Delete a registered domain' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.deleteDomain(id, context);
    return { message: 'Domain deleted successfully', data };
  }

  @Post(':id/credentials')
  @Permissions('domains.manage')
  @ApiOperation({
    summary: 'Register domain credentials (FTP, cPanel, Admin portal)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async addCredential(
    @Param('id') id: string,
    @Body() dto: any,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.addCredential(id, dto, context);
    return { message: 'Domain credentials configured', data };
  }

  @Get(':id/credentials')
  @Permissions('domains.manage')
  @ApiOperation({ summary: 'View decrypted credentials for domain' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCredentials(@Param('id') id: string) {
    const data = await this.service.getCredentials(id);
    return { message: 'Decrypted credentials retrieved', data };
  }

  @Delete('credentials/:credId')
  @Permissions('domains.manage')
  @ApiOperation({ summary: 'Remove a domain credential' })
  @ApiResponse({ type: SuccessResponseDto })
  async deleteCredential(@Param('credId') credId: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.deleteCredential(credId, context);
    return { message: 'Domain credential deleted', data };
  }

  @Post(':id/dns')
  @Permissions('domains.manage')
  @ApiOperation({ summary: 'Add a DNS Record (A, CNAME, TXT, MX)' })
  @ApiResponse({ type: SuccessResponseDto })
  async addDnsRecord(
    @Param('id') id: string,
    @Body() dto: CreateDnsRecordDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.addDnsRecord(id, dto, context);
    return { message: 'DNS record added successfully', data };
  }

  @Delete('dns/:recordId')
  @Permissions('domains.manage')
  @ApiOperation({ summary: 'Remove a DNS record' })
  @ApiResponse({ type: SuccessResponseDto })
  async deleteDnsRecord(
    @Param('recordId') recordId: string,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.deleteDnsRecord(recordId, context);
    return { message: 'DNS record deleted successfully', data };
  }
}
