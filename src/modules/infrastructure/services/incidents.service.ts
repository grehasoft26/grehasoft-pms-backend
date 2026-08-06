import { Injectable, NotFoundException } from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { CreateIncidentDto, CreateMaintenanceWindowDto } from '../dto/incidents.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly repository: InfrastructureRepository,
    private readonly logger: LoggerService
  ) {}

  async createIncident(dto: CreateIncidentDto, context: RequestContext) {
    const incident = await this.repository.createIncident({
      serverId: dto.serverId,
      domainId: dto.domainId,
      title: dto.title,
      description: dto.description,
      status: dto.status ?? 'INVESTIGATING',
      severity: dto.severity ?? 'MEDIUM',
      priority: dto.priority ?? 'P3',
      rootCause: dto.rootCause || '',
      affectedServices: dto.affectedServices || '',
      assignedEngineer: dto.assignedEngineer || '',
    });

    this.logger.audit(context.userId, 'Report Infrastructure Incident', 'incident', incident, { after: incident });
    return incident;
  }

  async resolveIncident(id: string, dto: any, context: RequestContext) {
    const before = await this.repository.findIncidentById(id);
    if (!before) throw new NotFoundException('Incident report not found');

    const updated = await this.repository.updateIncident(id, {
      status: 'RESOLVED',
      rootCause: dto.rootCause || before.rootCause,
      resolutionTime: dto.resolutionTime || null,
      postmortem: dto.postmortem || '',
      resolvedAt: new Date(),
    });

    this.logger.audit(context.userId, 'Resolve Infrastructure Incident', 'incident', updated, { before, after: updated });
    return updated;
  }

  async getIncidents(status?: string) {
    return this.repository.findIncidents(status);
  }

  async createMaintenanceWindow(dto: CreateMaintenanceWindowDto, context: RequestContext) {
    const window = await this.repository.createMaintenanceWindow({
      title: dto.title,
      description: dto.description || '',
      scheduledStart: new Date(dto.scheduledStart),
      scheduledEnd: new Date(dto.scheduledEnd),
      downtimeExpected: dto.downtimeExpected ?? true,
      status: dto.status ?? 'SCHEDULED',
    });

    this.logger.audit(context.userId, 'Schedule Maintenance Window', 'maintenanceWindow', window, { after: window });
    return window;
  }

  async getMaintenanceWindows() {
    return this.repository.findMaintenanceWindows();
  }
}
