import { Injectable } from '@nestjs/common';
import { ReportsRepository } from '../repositories/reports.repository';
import { TriggerAlertDto } from '../dto/alerts.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class AlertsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly logger: LoggerService,
  ) {}

  async triggerAlert(
    tenantId: string,
    dto: TriggerAlertDto,
    context: RequestContext,
  ) {
    const alert = await this.repository.createAlert(tenantId, {
      title: dto.title,
      description: dto.description,
      category: dto.category,
      severity: dto.severity,
      isTriggered: true,
      triggeredAt: new Date(),
    });

    // Notify integration: publish internal alerts
    console.log(
      `[BUSINESS ALERT EVENT] Alert Code Triggered: ${dto.title} | Severity: ${dto.severity} | Category: ${dto.category}`,
    );

    this.logger.audit(
      context.userId,
      'Trigger Business Alert',
      'businessAlert',
      alert,
      { after: alert },
    );
    return alert;
  }

  async getAlerts(tenantId: string) {
    return this.repository.findAlerts(tenantId);
  }
}
