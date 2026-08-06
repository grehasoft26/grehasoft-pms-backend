import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServersService } from '../services/servers.service';
import { CreateServerDto, CreateServerEnvironmentDto } from '../dto/servers.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('DevOps Servers')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('infrastructure/servers')
export class ServersController {
  constructor(private readonly service: ServersService) {}

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
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Provision a new server (IP, SSH Port, OS, specs)' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateServerDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createServer(dto, context);
    return { message: 'Server provisioned successfully', data };
  }

  @Get()
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get list of servers with filters' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId?: string) {
    const data = await this.service.getServers(projectId);
    return { message: 'Servers list retrieved', data };
  }

  @Get(':id')
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get server details with backups and monitoring alerts' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getServer(id);
    return { message: 'Server details retrieved', data };
  }

  @Post(':id/credentials')
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Register secure server credentials (SSH private keys, passwords, encrypted)' })
  @ApiResponse({ type: SuccessResponseDto })
  async addCredential(@Param('id') id: string, @Body() dto: any, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.addCredential(id, dto, context);
    return { message: 'Server credentials configured', data };
  }

  @Get(':id/credentials')
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'View decrypted credentials' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCredentials(@Param('id') id: string) {
    const data = await this.service.getCredentials(id);
    return { message: 'Decrypted credentials retrieved', data };
  }

  @Post('environments')
  @Permissions('infrastructure.manage')
  @ApiOperation({ summary: 'Create a deployment environment on a server' })
  @ApiResponse({ type: SuccessResponseDto })
  async createEnvironment(@Body() dto: CreateServerEnvironmentDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createServerEnvironment(dto, context);
    return { message: 'Server environment defined successfully', data };
  }

  @Get(':id/environments')
  @Permissions('infrastructure.read')
  @ApiOperation({ summary: 'Get deployment environments list for server' })
  @ApiResponse({ type: SuccessResponseDto })
  async getEnvironments(@Param('id') id: string) {
    const data = await this.service.getEnvironments(id);
    return { message: 'Server environments retrieved', data };
  }
}
