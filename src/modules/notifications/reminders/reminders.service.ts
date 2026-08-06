import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { CreateReminderDto } from '../dto/reminders.dto';

@Injectable()
export class ReminderService {
  constructor(private readonly repository: NotificationsRepository) {}

  async createReminder(tenantId: string, dto: CreateReminderDto) {
    const rem = await this.repository.createReminder(tenantId, {
      title: dto.title,
      description: dto.description || '',
      frequency: dto.frequency || 'ONCE',
      targetDate: new Date(dto.targetDate),
    });

    await this.repository.logAudit(tenantId, 'Create Reminder', `Reminder created: ${dto.title}.`);
    return rem;
  }

  async getReminders(tenantId: string, isCompleted?: boolean) {
    return this.repository.findReminders(tenantId, isCompleted);
  }

  async triggerReminderRuns(tenantId: string) {
    const reminders = await this.getReminders(tenantId, false);
    const now = new Date();
    const triggered: string[] = [];

    for (const rem of reminders) {
      if (rem.targetDate <= now) {
        await this.repository.prisma.reminder.update({
          where: { id: rem.id },
          data: { isCompleted: true },
        });

        // Event notice simulated dispatcher
        console.log(`[REMINDER TRIGGER EVENT] Reminder Title: ${rem.title}`);
        triggered.push(rem.id);
      }
    }

    if (triggered.length > 0) {
      await this.repository.logAudit(tenantId, 'Trigger Reminders Run', `Triggered ${triggered.length} overdue reminders.`);
    }

    return triggered;
  }
}
