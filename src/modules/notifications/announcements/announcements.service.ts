import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { CreateAnnouncementDto } from '../dto/announcements.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async createAnnouncement(tenantId: string, dto: CreateAnnouncementDto, context: RequestContext) {
    const ann = await this.repository.createAnnouncement(tenantId, context.userId, {
      title: dto.title,
      content: dto.content,
      priority: dto.priority || 'NORMAL',
      departmentId: dto.departmentId || null,
    });

    await this.repository.logAudit(tenantId, 'Create Announcement', `Announcement created: ${dto.title}.`);
    return ann;
  }

  async getAnnouncements(tenantId: string, departmentId?: string) {
    return this.repository.findAnnouncements(tenantId, departmentId);
  }
}
