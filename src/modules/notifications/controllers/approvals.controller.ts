import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkflowEngine } from '../approvals/workflow.engine';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { SubmitApprovalDecisionDto } from '../dto/workflow.dto';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@ApiTags('Workflows Approvals')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications/workflow')
export class ApprovalsController {
  constructor(
    private readonly engine: WorkflowEngine,
    private readonly repository: NotificationsRepository
  ) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post('start/:workflowDefinitionId')
  @Permissions('workflow.manage')
  @ApiOperation({ summary: 'Start new approval workflow instance execution' })
  @ApiResponse({ type: SuccessResponseDto })
  async startWorkflow(
    @Param('workflowDefinitionId') definitionId: string,
    @Body() body: { entityId: string; entityType: string },
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.engine.startWorkflow(tenantId, definitionId, body.entityId, body.entityType, context);
    return { message: 'Workflow execution initiated successfully', data };
  }

  @Get('requests')
  @Permissions('workflow.read')
  @ApiOperation({ summary: 'Get list of pending approval requests for active user' })
  @ApiResponse({ type: SuccessResponseDto })
  async getPendingRequests(@Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.repository.findApprovalRequests(tenantId, context.userId);
    return { message: 'Pending approval requests retrieved', data };
  }

  @Post('requests/:id/decision')
  @Permissions('workflow.read')
  @ApiOperation({ summary: 'Submit approval decision (APPROVED/REJECTED)' })
  @ApiResponse({ type: SuccessResponseDto })
  async submitDecision(
    @Param('id') id: string,
    @Body() dto: SubmitApprovalDecisionDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.engine.submitDecision(tenantId, id, dto, context);
    return { message: 'Approval request decision submitted', data };
  }
}
