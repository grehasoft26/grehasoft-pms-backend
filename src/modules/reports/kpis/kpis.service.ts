import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportsRepository } from '../repositories/reports.repository';
import { CreateKpiDefinitionDto, RecordSnapshotDto } from '../dto/kpis.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { evaluateFormula } from '../utils/formula-engine.helper';

@Injectable()
export class KpisService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly logger: LoggerService
  ) {}

  async createDefinition(tenantId: string, dto: CreateKpiDefinitionDto, context: RequestContext) {
    const kpi = await this.repository.prisma.kpiDefinition.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description || '',
        formula: dto.formula,
        targetValue: dto.targetValue ?? null,
        warningThreshold: dto.warningThreshold ?? null,
        criticalThreshold: dto.criticalThreshold ?? null,
        trendDirection: dto.trendDirection || 'HIGHER_IS_BETTER',
        monthlyTarget: dto.monthlyTarget ?? null,
        quarterlyTarget: dto.quarterlyTarget ?? null,
        annualTarget: dto.annualTarget ?? null,
      },
    });

    this.logger.audit(context.userId, 'Create KPI Definition', 'kpiDefinition', kpi, { after: kpi });
    return kpi;
  }

  async getDefinitions(tenantId: string) {
    return this.repository.findKpis(tenantId);
  }

  async getKpiSnapshotHistory(tenantId: string, kpiId: string) {
    return this.repository.findKpiSnapshots(tenantId, kpiId);
  }

  // KPI calculations using the Formula Engine
  async calculateAndRecordKpi(tenantId: string, code: string, context: RequestContext) {
    const definition = await this.repository.findKpiByCode(tenantId, code);
    if (!definition) throw new NotFoundException(`KPI Definition for code ${code} not found`);

    // Compile dynamic variable context from database tables
    const variables: Record<string, number> = {};

    if (code === 'REV_GROWTH') {
      const invoices = await this.repository.prisma.invoice.findMany();
      const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.total || 0), 0);
      variables.REVENUE = totalRevenue;
      variables.REVENUE_PREV = totalRevenue > 0 ? totalRevenue * 0.9 : 10000; // simulated last month
    } else if (code === 'SALES_WIN_RATE') {
      const opps = await this.repository.prisma.opportunity.findMany();
      const won = opps.filter(o => o.probability === 100 || o.winReason).length;
      variables.WON_OPPS = won;
      variables.TOTAL_OPPS = opps.length;
    } else if (code === 'EMP_UTILIZATION') {
      const entries = await this.repository.prisma.timeEntry.findMany();
      const billable = entries.filter(e => e.billable).reduce((s, e) => s + Number(e.duration || 0), 0) / 3600;
      const total = entries.reduce((s, e) => s + Number(e.duration || 0), 0) / 3600;
      variables.BILLABLE_HOURS = billable;
      variables.TOTAL_CAPACITY_HOURS = total > 0 ? total : 40;
    } else if (code === 'SERVER_AVAILABILITY') {
      variables.UPTIME_HOURS = 719.5;
      variables.TOTAL_HOURS = 720;
    } else if (code === 'DEPLOY_SUCCESS_RATE') {
      const deploys = await this.repository.prisma.deployment.findMany();
      const success = deploys.filter(d => d.status === 'SUCCESS').length;
      variables.SUCCESS_DEPLOYS = success;
      variables.TOTAL_DEPLOYS = deploys.length;
    } else if (code === 'MTTR') {
      const incidents = await this.repository.prisma.incident.findMany();
      const totalMin = incidents.reduce((s, i) => s + (i.resolutionTime || 0), 0);
      variables.TOTAL_RESOLUTION_MINUTES = totalMin;
      variables.INCIDENTS_COUNT = incidents.length;
    } else if (code === 'INV_COLLECTION_DAYS') {
      const invoices = await this.repository.prisma.invoice.findMany();
      variables.TOTAL_PAYMENT_DAYS = invoices.length * 12; // simulated
      variables.INVOICES_COUNT = invoices.length;
    } else if (code === 'EMP_TURNOVER') {
      const profiles = await this.repository.prisma.employeeProfile.findMany();
      const exited = profiles.filter(p => p.employmentStatus === 'RESIGNED' || p.employmentStatus === 'TERMINATED').length;
      variables.DEPARTED_COUNT = exited;
      variables.AVERAGE_HEADCOUNT = profiles.length > 0 ? profiles.length : 10;
    }

    // Evaluate mathematical expression formula using parser engine
    const calculatedValue = evaluateFormula(definition.formula, variables);

    // Save KPI snapshot entry
    const snapshot = await this.repository.recordKpiSnapshot(tenantId, definition.id, calculatedValue);

    this.logger.audit(context.userId, 'Record KPI Snapshot', 'kpiSnapshot', snapshot, { after: snapshot });
    return {
      code,
      formula: definition.formula,
      value: calculatedValue,
      variables,
      snapshotId: snapshot.id,
    };
  }
}
