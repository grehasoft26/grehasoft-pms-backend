import { Injectable, BadRequestException } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class NotificationTemplateService {
  constructor(private readonly repository: NotificationsRepository) {}

  render(body: string, variables: Record<string, string>): string {
    if (!body) return '';
    let rendered = body;

    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, val || '');
    }

    return rendered;
  }

  async getTemplate(tenantId: string, code: string) {
    const template =
      await this.repository.prisma.notificationTemplate.findFirst({
        where: { tenantId, code },
      });
    if (!template) {
      // Fallback system template check
      return this.repository.prisma.notificationTemplate.findUnique({
        where: { code },
      });
    }
    return template;
  }
}
