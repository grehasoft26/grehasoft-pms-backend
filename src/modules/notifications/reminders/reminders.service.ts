import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { CreateReminderDto, UpdateReminderDto } from '../dto/reminders.dto';

@Injectable()
export class ReminderService {
  constructor(private readonly repository: NotificationsRepository) {}

  async createReminder(
    tenantId: string,
    dto: CreateReminderDto,
    userId: string,
  ) {
    const rem = await this.repository.createReminder(tenantId, {
      title: dto.title,
      description: dto.description || '',
      frequency: dto.frequency || 'ONCE',
      targetDate: new Date(dto.targetDate),
      createdBy: userId,
    });

    await this.repository.logAudit(
      tenantId,
      'Create Reminder',
      `Reminder created: ${dto.title}.`,
    );
    return rem;
  }

  async getReminders(tenantId: string, isCompleted?: boolean, userId?: string) {
    return this.repository.findReminders(tenantId, isCompleted, userId);
  }

  async getReminderById(
    tenantId: string,
    id: string,
    userId: string,
    isAdmin = false,
  ) {
    const rem = await this.repository.findReminderById(tenantId, id);
    if (!rem) {
      throw new NotFoundException('Reminder not found');
    }
    if (!isAdmin && rem.createdBy !== userId) {
      throw new ForbiddenException('You do not have access to this reminder');
    }
    return rem;
  }

  async updateReminder(
    tenantId: string,
    id: string,
    dto: UpdateReminderDto,
    userId: string,
    isAdmin = false,
  ) {
    const rem = await this.getReminderById(tenantId, id, userId, isAdmin);
    const updated = await this.repository.updateReminder(tenantId, id, {
      title: dto.title !== undefined ? dto.title : rem.title,
      description:
        dto.description !== undefined ? dto.description : rem.description,
      frequency: dto.frequency !== undefined ? dto.frequency : rem.frequency,
      targetDate:
        dto.targetDate !== undefined
          ? new Date(dto.targetDate)
          : rem.targetDate,
      isCompleted:
        dto.isCompleted !== undefined ? dto.isCompleted : rem.isCompleted,
      updatedBy: userId,
    });
    await this.repository.logAudit(
      tenantId,
      'Update Reminder',
      `Reminder updated: ${updated.title}.`,
    );
    return updated;
  }

  async deleteReminder(
    tenantId: string,
    id: string,
    userId: string,
    isAdmin = false,
  ) {
    await this.getReminderById(tenantId, id, userId, isAdmin);
    const deleted = await this.repository.deleteReminder(tenantId, id, userId);
    await this.repository.logAudit(
      tenantId,
      'Delete Reminder',
      `Reminder deleted: ${deleted.title}.`,
    );
    return deleted;
  }

  async toggleReminderCompletion(
    tenantId: string,
    id: string,
    userId: string,
    isAdmin = false,
  ) {
    const rem = await this.getReminderById(tenantId, id, userId, isAdmin);
    const updated = await this.repository.updateReminder(tenantId, id, {
      isCompleted: !rem.isCompleted,
      updatedBy: userId,
    });
    await this.repository.logAudit(
      tenantId,
      'Toggle Reminder Completion',
      `Reminder completion toggled: ${updated.title} (${updated.isCompleted}).`,
    );
    return updated;
  }

  async getRemindersSummary(tenantId: string, userId?: string) {
    const reminders = await this.repository.findReminders(
      tenantId,
      undefined,
      userId,
    );
    const now = new Date();
    let pending = 0;
    let completed = 0;
    let overdue = 0;

    for (const rem of reminders) {
      if (rem.isCompleted) {
        completed++;
      } else if (rem.targetDate < now) {
        overdue++;
      } else {
        pending++;
      }
    }

    return { pending, completed, overdue };
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
      await this.repository.logAudit(
        tenantId,
        'Trigger Reminders Run',
        `Triggered ${triggered.length} overdue reminders.`,
      );
    }

    return triggered;
  }

  async processReminderAlerts() {
    const now = new Date();
    // Get all active, uncompleted reminders across all tenants
    const reminders = await this.repository.prisma.reminder.findMany({
      where: {
        isCompleted: false,
        deletedAt: null,
      },
    });

    for (const rem of reminders) {
      if (rem.targetDate <= now) {
        // Mark as completed to avoid double processing
        await this.repository.prisma.reminder.update({
          where: { id: rem.id },
          data: { isCompleted: true },
        });

        // 1. Create In-App Notification for the owner user
        if (rem.createdBy) {
          await this.repository.prisma.notification.create({
            data: {
              tenantId: rem.tenantId,
              userId: rem.createdBy,
              title: `Reminder Due: ${rem.title}`,
              message:
                rem.description ||
                `Your scheduled reminder "${rem.title}" is due now.`,
              type: 'REMINDER',
              status: 'PENDING',
            },
          });
        }

        // 2. Overdue/due email notifications to Super Admins (simulated via logCommunication)
        const superAdmins = await this.repository.prisma.user.findMany({
          where: {
            role: {
              name: 'Super Admin',
            },
            deletedAt: null,
          },
        });

        for (const admin of superAdmins) {
          // Log simulated SMTP communication alert
          await this.repository.logCommunication(rem.tenantId, {
            userId: admin.id,
            channel: 'EMAIL',
            recipient: admin.email,
            subject: `Grehasoft PMS - Reminder Alert (Due)`,
            body: `Grehasoft PMS Reminder Alert\n\nTitle: ${rem.title}\nDue Date: ${rem.targetDate.toISOString()}\nStatus: Due\nCreated By User ID: ${rem.createdBy || 'System'}\n\nPlease login to Grehasoft PMS for more details.`,
            status: 'SENT',
            sentAt: new Date(),
          });
        }

        console.log(
          `[REMINDER TASK] Processed due reminder ID ${rem.id}: ${rem.title}`,
        );
      }
    }
  }
}
