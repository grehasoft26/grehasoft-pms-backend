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
import { AssetsService } from '../services/assets.service';
import { CreateAssetAssignmentDto, ReturnAssetDto } from '../dto/assets.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('HR Asset Management')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  private getContext(req: Request): RequestContext {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = (req as any).user as { id?: string } | undefined;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('assignments/:profileId')
  @Permissions('assets.manage')
  @ApiOperation({
    summary:
      'Assign asset to employee (Laptop, Monitor, SIM, Access Card, License)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async assign(
    @Param('profileId') profileId: string,
    @Body() dto: CreateAssetAssignmentDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.assignAsset(profileId, dto, context);
    return { message: 'Asset assigned successfully', data };
  }

  @Patch('assignments/:id/status')
  @Permissions('assets.manage')
  @ApiOperation({
    summary: 'Update asset status (Returned, Lost, Damaged, Repair, Disposed)',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: ReturnAssetDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.service.updateAssetStatus(id, dto, context);
    return {
      message: `Asset assignment status updated to ${dto.status}`,
      data,
    };
  }

  @Get('assignments/all')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get list of all company asset assignments' })
  @ApiResponse({ type: SuccessResponseDto })
  async getAllAssignments() {
    const data = await this.service.getAllAssetAssignments();
    return { message: 'All asset assignments list retrieved', data };
  }

  @Get('assignments/:profileId')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get assigned assets list for employee' })
  @ApiResponse({ type: SuccessResponseDto })
  async getAssignments(@Param('profileId') profileId: string) {
    const data = await this.service.getAssetAssignments(profileId);
    return { message: 'Employee asset assignments list', data };
  }

  @Get('assignments/detail/:id')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get specific asset details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getDetail(@Param('id') id: string) {
    const data = await this.service.getAssetAssignmentById(id);
    return { message: 'Asset assignment details retrieved', data };
  }
}
