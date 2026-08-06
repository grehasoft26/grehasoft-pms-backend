import { Injectable, NotFoundException } from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { CreateBackupScheduleDto, CreateBackupDto } from '../dto/backups.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BackupStatus } from '@prisma/client';

@Injectable()
export class BackupsService {
  constructor(
    private readonly repository: InfrastructureRepository,
    private readonly logger: LoggerService
  ) {}

  async createSchedule(dto: CreateBackupScheduleDto, context: RequestContext) {
    const schedule = await this.repository.createBackupSchedule({
      serverId: dto.serverId,
      hostingAccountId: dto.hostingAccountId,
      name: dto.name,
      frequency: dto.frequency,
      retentionDays: dto.retentionDays ?? 30,
      isActive: dto.isActive ?? true,
    });

    this.logger.audit(context.userId, 'Create Backup Schedule', 'backupSchedule', schedule, { after: schedule });
    return schedule;
  }

  async triggerBackup(dto: CreateBackupDto, context: RequestContext) {
    const backup = await this.repository.createBackup({
      serverId: dto.serverId,
      hostingAccountId: dto.hostingAccountId,
      scheduleId: dto.scheduleId,
      name: dto.name,
      filePath: dto.filePath || `/backups/archive/${Date.now()}.tar.gz`,
      fileSizeMb: dto.fileSizeMb || 150.00,
      status: BackupStatus.COMPLETED,
      backupType: dto.backupType || 'DATABASE',
      isFull: dto.isFull ?? true,
      isEncrypted: dto.isEncrypted ?? false,
      restoreTested: dto.restoreTested ?? false,
      restorePoint: dto.restorePoint ?? false,
      completedAt: new Date(),
    });

    this.logger.audit(context.userId, 'Trigger Manual Backup Success', 'backup', backup, { after: backup });
    return backup;
  }

  async getBackups(serverId?: string, hostingAccountId?: string) {
    return this.repository.findBackups({ serverId, hostingAccountId });
  }

  async getSchedules(serverId?: string) {
    return this.repository.findBackupSchedules(serverId);
  }
}
