import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { SubmitApprovalDecisionDto } from '../dto/workflow.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@Injectable()
export class WorkflowEngine {
  constructor(private readonly repository: NotificationsRepository) {}

  async startWorkflow(tenantId: string, workflowDefinitionId: string, entityId: string, entityType: string, context: RequestContext) {
    const definition = await this.repository.prisma.workflowDefinition.findFirst({
      where: { tenantId, id: workflowDefinitionId },
      include: { steps: true },
    });
    if (!definition) throw new NotFoundException('Workflow definition not found');
    if (definition.steps.length === 0) throw new BadRequestException('Workflow must have at least one step');

    // Create execution
    const execution = await this.repository.createWorkflowExecution(tenantId, {
      workflowDefinitionId,
      entityId,
      entityType,
      currentStepOrder: 1,
      status: 'IN_PROGRESS',
      initiatorId: context.userId,
    });

    // Create initial approval request for Step Order 1
    const firstStep = definition.steps.find((s) => s.stepOrder === 1);
    if (firstStep) {
      // Find approvers by role or fallback to Super Admin
      const approverId = context.userId; // Mock approver as same user for self-approvals/testing
      await this.repository.createApprovalRequest(tenantId, {
        workflowExecutionId: execution.id,
        stepOrder: 1,
        approverId,
        decision: 'PENDING',
      });
    }

    await this.repository.logAudit(tenantId, 'Start Workflow', `Workflow execution ${execution.id} started for entity ${entityId}.`);
    return execution;
  }

  async submitDecision(tenantId: string, requestId: string, dto: SubmitApprovalDecisionDto, context: RequestContext) {
    const request = await this.repository.findApprovalRequestById(tenantId, requestId);
    if (!request) throw new NotFoundException('Approval request not found');
    if (request.decision !== 'PENDING') throw new BadRequestException('Decision already finalized');

    // Update approval request
    await this.repository.updateApprovalDecision(tenantId, requestId, dto.decision, dto.comments);

    const execution = await this.repository.findWorkflowExecutionById(tenantId, request.workflowExecutionId);
    if (!execution) throw new NotFoundException('Workflow execution not found');

    if (dto.decision === 'REJECTED') {
      await this.repository.updateWorkflowExecution(tenantId, execution.id, {
        status: 'REJECTED',
      });
      await this.repository.logAudit(tenantId, 'Workflow Rejected', `Workflow execution ${execution.id} rejected.`);
      return { status: 'REJECTED' };
    }

    // Step Order level checks
    const steps = execution.workflowDefinition.steps;
    const currentStepOrder = execution.currentStepOrder;

    const allRequests = execution.approvalRequests;
    const currentStepRequests = allRequests.filter((r) => r.stepOrder === currentStepOrder);
    const allApproved = currentStepRequests.every((r) => r.decision === 'APPROVED' || r.id === requestId);

    if (allApproved) {
      const nextStep = steps.find((s) => s.stepOrder === currentStepOrder + 1);
      if (nextStep) {
        // Transition next order step
        await this.repository.updateWorkflowExecution(tenantId, execution.id, {
          currentStepOrder: currentStepOrder + 1,
        });

        // Create new approval request for next level
        const nextApproverId = context.userId; // Mock approver
        await this.repository.createApprovalRequest(tenantId, {
          workflowExecutionId: execution.id,
          stepOrder: currentStepOrder + 1,
          approverId: nextApproverId,
          decision: 'PENDING',
        });

        await this.repository.logAudit(tenantId, 'Workflow Transition', `Workflow execution ${execution.id} transitioned to step ${currentStepOrder + 1}.`);
        return { status: 'TRANSITIONED', nextStepOrder: currentStepOrder + 1 };
      } else {
        // No next step -> APPROVED
        await this.repository.updateWorkflowExecution(tenantId, execution.id, {
          status: 'APPROVED',
        });
        await this.repository.logAudit(tenantId, 'Workflow Approved', `Workflow execution ${execution.id} fully approved.`);
        return { status: 'APPROVED' };
      }
    }

    return { status: 'PENDING_OTHER_APPROVERS' };
  }
}
