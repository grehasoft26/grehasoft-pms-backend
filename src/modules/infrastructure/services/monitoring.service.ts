import { Injectable } from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { UpdateMonitoringCheckDto } from '../dto/monitoring.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class MonitoringService {
  constructor(
    private readonly repository: InfrastructureRepository,
    private readonly logger: LoggerService,
  ) {}

  // Publish internal events simulation
  async publishInfraEvent(
    event: string,
    resourceId: string,
    description: string,
  ) {
    console.log(
      `[INFRASTRUCTURE EVENT] Event: ${event} | Resource: ${resourceId} | Desc: ${description}`,
    );
    await this.repository.createTimelineEvent(
      resourceId,
      'System',
      event,
      description,
    );
  }

  async recordMetrics(
    serverId: string,
    dto: UpdateMonitoringCheckDto,
    context: RequestContext,
  ) {
    const check = await this.repository.createMonitoringCheck({
      serverId,
      name: 'System Load check',
      checkType: 'SYSTEM_RESOURCE',
      value: dto.value || 'Resource limits metrics log',
      cpuUsage: dto.cpuUsage || null,
      ramUsage: dto.ramUsage || null,
      diskUsage: dto.diskUsage || null,
      loadAverage: dto.loadAverage || null,
      networkInKbps: dto.networkInKbps || null,
      networkOutKbps: dto.networkOutKbps || null,
      responseTimeMs: dto.responseTimeMs || null,
      lastCheckedAt: new Date(),
      status: dto.status,
    });

    // Alert triggers checks
    if (dto.cpuUsage && dto.cpuUsage > 90.0) {
      await this.publishInfraEvent(
        'High CPU',
        serverId,
        `CPU load average spiked to ${dto.cpuUsage}%`,
      );
    }

    if (dto.status === 'CRITICAL') {
      await this.publishInfraEvent(
        'Server Down',
        serverId,
        `Monitoring status flagged as CRITICAL: Server unreachable`,
      );
    }

    this.logger.audit(
      context.userId,
      'Record Monitoring Metrics',
      'monitoringCheck',
      check,
      { after: check },
    );
    return check;
  }

  async getChecks(serverId?: string, domainId?: string) {
    return this.repository.findMonitoringChecks({ serverId, domainId });
  }
}
