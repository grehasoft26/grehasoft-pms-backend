import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowEngine } from '../approvals/workflow.engine';
import { WebhookService } from '../webhooks/webhook.service';

@Injectable()
export class AutomationEngine {
  private readonly logger = new Logger(AutomationEngine.name);

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly workflowEngine: WorkflowEngine,
    private readonly webhookService: WebhookService
  ) {}

  // Central execution method for automation rules
  async executeRules(tenantId: string, eventName: string, entityId: string, payload: any) {
    const rules = await this.repository.findAutomationRuleByEvent(tenantId, eventName);
    const results: any[] = [];

    for (const rule of rules) {
      const startTime = new Date();
      let status = 'SUCCESS';
      let errorMsg = '';
      let resultMessage = '';

      try {
        // Trigger configured action
        if (rule.actionType === 'NOTIFICATION') {
          const config = JSON.parse(rule.actionConfigJson);
          const userId = config.userId || payload.userId || 'system';
          await this.notificationsService.sendNotification(
            tenantId,
            userId,
            rule.name,
            config.message || `Automated trigger event: ${eventName}`,
            'INFO'
          );
          resultMessage = `Sent notification to user ${userId}`;
        } else if (rule.actionType === 'WORKFLOW') {
          const config = JSON.parse(rule.actionConfigJson);
          const exec = await this.workflowEngine.startWorkflow(
            tenantId,
            config.workflowDefinitionId,
            entityId,
            config.entityType || 'GENERAL',
            { userId: payload.userId || 'system', ip: '', userAgent: '', correlationId: '' }
          );
          resultMessage = `Initiated approval workflow execution ${exec.id}`;
        }

        // Trigger outbound webhooks delivery
        await this.webhookService.triggerEvent(tenantId, eventName, { entityId, ...payload });
      } catch (err: any) {
        status = 'FAILED';
        errorMsg = err.message || 'Automation execution failed';
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Log automation execution history
      const execLog = await this.repository.logAutomationExecution(tenantId, {
        automationRuleId: rule.id,
        triggeredEntity: entityId,
        executionStartedAt: startTime,
        executionCompletedAt: endTime,
        executionDuration: duration,
        executionResult: resultMessage || errorMsg,
        status,
        errorMessage: errorMsg || null,
        triggerSource: eventName,
      });

      results.push(execLog);
    }

    return results;
  }

  // Task Events Listeners
  @OnEvent('task.completed')
  async handleTaskCompleted(payload: any) {
    this.logger.log(`[AUTOMATION] Event task.completed received: ${JSON.stringify(payload)}`);
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'task.completed', payload.taskId, payload);
  }

  @OnEvent('task.assigned')
  async handleTaskAssigned(payload: any) {
    this.logger.log(`[AUTOMATION] Event task.assigned received: ${JSON.stringify(payload)}`);
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'task.assigned', payload.taskId, payload);
  }

  @OnEvent('task.comment.added')
  async handleTaskCommentAdded(payload: any) {
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'task.comment.added', payload.taskId, payload);
  }

  // Finance Events Listeners
  @OnEvent('invoice.paid')
  async handleInvoicePaid(payload: any) {
    this.logger.log(`[AUTOMATION] Event invoice.paid received: ${JSON.stringify(payload)}`);
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'invoice.paid', payload.invoiceId, payload);
  }

  @OnEvent('invoice.generated')
  async handleInvoiceGenerated(payload: any) {
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'invoice.generated', payload.invoiceId, payload);
  }

  // CRM Events Listeners
  @OnEvent('lead.created')
  async handleLeadCreated(payload: any) {
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'lead.created', payload.leadId, payload);
  }

  @OnEvent('proposal.approved')
  async handleProposalApproved(payload: any) {
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'proposal.approved', payload.proposalId, payload);
  }

  // HR Events Listeners
  @OnEvent('leave.submitted')
  async handleLeaveSubmitted(payload: any) {
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'leave.submitted', payload.leaveRequestId, payload);
  }

  // Infrastructure Events Listeners
  @OnEvent('server.down')
  async handleServerDown(payload: any) {
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'server.down', payload.serverId, payload);
  }

  // Reports Events Listeners
  @OnEvent('alert.triggered')
  async handleAlertTriggered(payload: any) {
    const tenantId = payload.tenantId || '00000000-0000-0000-0000-000000000000';
    await this.executeRules(tenantId, 'alert.triggered', payload.alertId, payload);
  }
}
