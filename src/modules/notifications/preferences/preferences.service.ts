import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { UpdatePreferenceDto } from '../dto/preferences.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

@Injectable()
export class PreferencesService {
  constructor(private readonly repository: NotificationsRepository) {}

  async updatePreference(
    tenantId: string,
    userId: string,
    dto: UpdatePreferenceDto,
    context: RequestContext,
  ) {
    const pref = await this.repository.upsertPreference(tenantId, userId, {
      channel: dto.channel,
      enabled: dto.enabled,
      digestFrequency: dto.digestFrequency,
      quietHoursStart: dto.quietHoursStart || null,
      quietHoursEnd: dto.quietHoursEnd || null,
      timezone: dto.timezone || 'UTC',
    });

    await this.repository.logAudit(
      tenantId,
      'Update Preference',
      `User preference updated for channel ${dto.channel}.`,
    );
    return pref;
  }

  async getPreferences(tenantId: string, userId: string) {
    return this.repository.findPreferences(tenantId, userId);
  }
}
