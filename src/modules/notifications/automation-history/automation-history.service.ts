import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class AutomationHistoryService {
  constructor(private readonly repository: NotificationsRepository) {}

  async getExecutions(tenantId: string) {
    return this.repository.findAutomationExecutions(tenantId);
  }

  async getExecutionLogs(tenantId: string, ruleId: string) {
    return this.repository.prisma.automationExecution.findMany({
      where: { tenantId, automationRuleId: ruleId },
      orderBy: { executionStartedAt: 'desc' },
    });
  }
}
