import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationChannel, NotificationStatus, ApprovalDecision } from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(public readonly prisma: PrismaService) {}

  private tenantWhere(tenantId: string, customWhere: any = {}) {
    return {
      tenantId,
      deletedAt: null,
      ...customWhere,
    };
  }

  // Preferences
  async upsertPreference(tenantId: string, userId: string, data: any) {
    const existing = await this.prisma.notificationPreference.findFirst({
      where: { tenantId, userId, channel: data.channel },
    });
    if (existing) {
      return this.prisma.notificationPreference.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.notificationPreference.create({
      data: { tenantId, userId, ...data },
    });
  }

  async findPreferences(tenantId: string, userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: this.tenantWhere(tenantId, { userId }),
    });
  }

  // Notifications read/click tracking
  async createNotification(tenantId: string, data: any) {
    return this.prisma.notification.create({
      data: { tenantId, ...data },
    });
  }

  async findNotifications(tenantId: string, userId: string, unreadOnly = false) {
    const where: any = this.tenantWhere(tenantId, { userId });
    if (unreadOnly) {
      where.status = 'PENDING';
      where.readAt = null;
    }
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(tenantId: string, id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  async markAsClicked(tenantId: string, id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        clickedAt: new Date(),
      },
    });
  }

  async archiveNotification(tenantId: string, id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
    });
  }

  // Announcements
  async createAnnouncement(tenantId: string, creatorId: string, data: any) {
    return this.prisma.announcement.create({
      data: { tenantId, creatorId, ...data },
    });
  }

  async findAnnouncements(tenantId: string, departmentId?: string) {
    const where: any = this.tenantWhere(tenantId);
    if (departmentId) {
      where.OR = [
        { departmentId: null },
        { departmentId },
      ];
    }
    return this.prisma.announcement.findMany({
      where,
      include: { creator: true, department: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Reminders
  async createReminder(tenantId: string, data: any) {
    return this.prisma.reminder.create({
      data: { tenantId, ...data },
    });
  }

  async findReminders(tenantId: string, isCompleted?: boolean) {
    const where: any = this.tenantWhere(tenantId);
    if (isCompleted !== undefined) {
      where.isCompleted = isCompleted;
    }
    return this.prisma.reminder.findMany({
      where,
      orderBy: { targetDate: 'asc' },
    });
  }

  // Workflow Definition
  async createWorkflowDefinition(tenantId: string, data: any) {
    return this.prisma.workflowDefinition.create({
      data: { tenantId, ...data },
    });
  }

  async findWorkflowDefinitions(tenantId: string) {
    return this.prisma.workflowDefinition.findMany({
      where: this.tenantWhere(tenantId),
      include: { steps: true },
    });
  }

  async createWorkflowStep(tenantId: string, data: any) {
    return this.prisma.workflowStep.create({
      data: { tenantId, ...data },
    });
  }

  // Workflow Executions & Approvals
  async createWorkflowExecution(tenantId: string, data: any) {
    return this.prisma.workflowExecution.create({
      data: { tenantId, ...data },
    });
  }

  async findWorkflowExecutionById(tenantId: string, id: string) {
    return this.prisma.workflowExecution.findFirst({
      where: this.tenantWhere(tenantId, { id }),
      include: { workflowDefinition: { include: { steps: true } }, approvalRequests: true },
    });
  }

  async updateWorkflowExecution(tenantId: string, id: string, data: any) {
    return this.prisma.workflowExecution.update({
      where: { id },
      data,
    });
  }

  async createApprovalRequest(tenantId: string, data: any) {
    return this.prisma.approvalRequest.create({
      data: { tenantId, ...data },
    });
  }

  async findApprovalRequests(tenantId: string, approverId: string) {
    return this.prisma.approvalRequest.findMany({
      where: this.tenantWhere(tenantId, { approverId, decision: 'PENDING' }),
      include: { workflowExecution: true },
    });
  }

  async findApprovalRequestById(tenantId: string, id: string) {
    return this.prisma.approvalRequest.findFirst({
      where: this.tenantWhere(tenantId, { id }),
    });
  }

  async updateApprovalDecision(tenantId: string, id: string, decision: ApprovalDecision, comments?: string) {
    const updated = await this.prisma.approvalRequest.update({
      where: { id },
      data: {
        decision,
        comments,
        actionedAt: new Date(),
      },
    });

    await this.prisma.approvalHistory.create({
      data: {
        tenantId,
        approvalRequestId: id,
        decision,
        comments: comments || '',
      },
    });

    return updated;
  }

  // Automation History Execution log
  async createAutomationRule(tenantId: string, data: any) {
    return this.prisma.automationRule.create({
      data: { tenantId, ...data },
    });
  }

  async findAutomationRules(tenantId: string) {
    return this.prisma.automationRule.findMany({
      where: this.tenantWhere(tenantId),
    });
  }

  async findAutomationRuleByEvent(tenantId: string, triggerEvent: string) {
    return this.prisma.automationRule.findMany({
      where: this.tenantWhere(tenantId, { triggerEvent, isActive: true }),
    });
  }

  async logAutomationExecution(tenantId: string, data: any) {
    return this.prisma.automationExecution.create({
      data: { tenantId, ...data },
    });
  }

  async findAutomationExecutions(tenantId: string) {
    return this.prisma.automationExecution.findMany({
      where: this.tenantWhere(tenantId),
      include: { automationRule: true },
      orderBy: { executionStartedAt: 'desc' },
    });
  }

  // Webhooks
  async createSubscription(tenantId: string, data: any) {
    return this.prisma.eventSubscription.create({
      data: { tenantId, ...data },
    });
  }

  async findSubscriptions(tenantId: string) {
    return this.prisma.eventSubscription.findMany({
      where: this.tenantWhere(tenantId, { isActive: true }),
    });
  }

  async logWebhookEvent(tenantId: string, data: any) {
    return this.prisma.webhookEvent.create({
      data: { tenantId, ...data },
    });
  }

  async logWebhookDelivery(tenantId: string, data: any) {
    return this.prisma.webhookDelivery.create({
      data: { tenantId, ...data },
    });
  }

  // Communication Logs & Audit Trails
  async logCommunication(tenantId: string, data: any) {
    return this.prisma.communicationLog.create({
      data: { tenantId, ...data },
    });
  }

  async findCommunicationLogs(tenantId: string) {
    return this.prisma.communicationLog.findMany({
      where: this.tenantWhere(tenantId),
      orderBy: { createdAt: 'desc' },
    });
  }

  async logAudit(tenantId: string, action: string, details: string) {
    return this.prisma.notificationAudit.create({
      data: { tenantId, action, details },
    });
  }

  async findAudits(tenantId: string) {
    return this.prisma.notificationAudit.findMany({
      where: this.tenantWhere(tenantId),
      orderBy: { createdAt: 'desc' },
    });
  }
}
