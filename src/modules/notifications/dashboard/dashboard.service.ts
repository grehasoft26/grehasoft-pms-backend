import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: NotificationsRepository) {}

  async getStatistics(tenantId: string, userId: string) {
    const unreadNotifications = await this.repository.prisma.notification.count({
      where: { tenantId, userId, status: 'PENDING', readAt: null },
    });

    const pendingApprovals = await this.repository.prisma.approvalRequest.count({
      where: { tenantId, approverId: userId, decision: 'PENDING' },
    });

    const scheduledReminders = await this.repository.prisma.reminder.count({
      where: { tenantId, isCompleted: false },
    });

    const automationExecutions = await this.repository.prisma.automationExecution.count({
      where: { tenantId },
    });

    // Workflow success rate
    const totalWorkflows = await this.repository.prisma.workflowExecution.count({
      where: { tenantId },
    });
    const approvedWorkflows = await this.repository.prisma.workflowExecution.count({
      where: { tenantId, status: 'APPROVED' },
    });
    const successRate = totalWorkflows > 0 ? (approvedWorkflows / totalWorkflows) * 100 : 100;

    return {
      unreadNotificationsCount: unreadNotifications,
      pendingApprovalsCount: pendingApprovals,
      scheduledRemindersCount: scheduledReminders,
      automationExecutionsCount: automationExecutions,
      workflowSuccessRate: Math.round(successRate * 100) / 100,
    };
  }
}
