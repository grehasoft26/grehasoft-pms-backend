import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportsRepository } from '../repositories/reports.repository';
import { CreateReportDefinitionDto, PublishVersionDto, SaveFilterDto, CreateScheduledReportDto } from '../dto/reports.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { executeQuery } from '../utils/query-engine.helper';

@Injectable()
export class ReportsBuilderService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly logger: LoggerService
  ) {}

  // 1. Categories
  async createCategory(tenantId: string, name: string, code: string) {
    return this.repository.createCategory(tenantId, { name, code });
  }

  async getCategories(tenantId: string) {
    return this.repository.findCategories(tenantId);
  }

  // 2. Report Definitions
  async createReportDefinition(tenantId: string, dto: CreateReportDefinitionDto, context: RequestContext) {
    // Validate module
    const allowedModules = ['CRM', 'PROJECTS', 'FINANCE', 'HR', 'INFRASTRUCTURE', 'PRODUCTIVITY'];
    if (!allowedModules.includes(dto.module.toUpperCase())) {
      throw new BadRequestException(`Module ${dto.module} is not supported`);
    }

    // Dynamic field validation: verify JSON strings are valid
    try {
      JSON.parse(dto.fieldsJson);
      if (dto.filtersJson) JSON.parse(dto.filtersJson);
      if (dto.groupByJson) JSON.parse(dto.groupByJson);
      if (dto.aggregationsJson) JSON.parse(dto.aggregationsJson);
    } catch (e) {
      throw new BadRequestException('Validation failed: Malformed JSON parameters');
    }

    const report = await this.repository.createDefinition(tenantId, {
      categoryId: dto.categoryId,
      name: dto.name,
      code: dto.code,
      description: dto.description || '',
      module: dto.module,
      fieldsJson: dto.fieldsJson,
      filtersJson: dto.filtersJson || null,
      sortJson: dto.sortJson || null,
      groupByJson: dto.groupByJson || null,
      aggregationsJson: dto.aggregationsJson || null,
      chartConfigJson: dto.chartConfigJson || null,
      exportConfigJson: dto.exportConfigJson || null,
    });

    this.logger.audit(context.userId, 'Create Report Definition', 'reportDefinition', report, { after: report });
    return report;
  }

  async getReportDefinitions(tenantId: string, categoryId?: string, search?: string) {
    return this.repository.findDefinitions(tenantId, categoryId, search);
  }

  // 3. Report Versioning
  async publishVersion(tenantId: string, reportId: string, dto: PublishVersionDto, context: RequestContext) {
    const report = await this.repository.findDefinitionById(tenantId, reportId);
    if (!report) throw new NotFoundException('Report definition not found');

    const versionRecord = await this.repository.createVersion(tenantId, {
      reportDefinitionId: reportId,
      version: dto.version,
      changeSummary: dto.changeSummary || '',
      createdByUserId: context.userId,
      isPublished: true,
      fieldsJson: dto.fieldsJson,
      filtersJson: dto.filtersJson || null,
      chartConfigJson: dto.chartConfigJson || null,
    });

    // Update definition to newest version
    await this.repository.updateDefinition(tenantId, reportId, {
      currentVersion: dto.version,
      fieldsJson: dto.fieldsJson,
      filtersJson: dto.filtersJson || null,
      chartConfigJson: dto.chartConfigJson || null,
    });

    this.logger.audit(context.userId, 'Publish Report Version', 'reportVersion', versionRecord, { after: versionRecord });
    return versionRecord;
  }

  async rollbackVersion(tenantId: string, reportId: string, version: string, context: RequestContext) {
    const report = await this.repository.findDefinitionById(tenantId, reportId);
    if (!report) throw new NotFoundException('Report definition not found');

    const versionRecord = await this.repository.findVersionBySemver(tenantId, reportId, version);
    if (!versionRecord) throw new NotFoundException(`Report version ${version} not found`);

    await this.repository.updateDefinition(tenantId, reportId, {
      currentVersion: version,
      fieldsJson: versionRecord.fieldsJson,
      filtersJson: versionRecord.filtersJson,
      chartConfigJson: versionRecord.chartConfigJson,
    });

    this.logger.audit(context.userId, 'Rollback Report Version', 'reportDefinition', report, { after: report });
    return { message: `Report definition rolled back to version ${version}`, currentVersion: version };
  }

  // 4. Saved Filters
  async saveFilter(tenantId: string, reportId: string, dto: SaveFilterDto, context: RequestContext) {
    const filter = await this.repository.createSavedFilter(tenantId, {
      reportDefinitionId: reportId,
      userId: context.userId,
      departmentId: dto.departmentId,
      name: dto.name,
      scope: dto.scope || 'PERSONAL',
      datePreset: dto.datePreset || 'CUSTOM',
      filtersJson: dto.filtersJson,
    });

    return filter;
  }

  async getSavedFilters(tenantId: string, reportId: string, context: RequestContext) {
    return this.repository.findSavedFilters(tenantId, reportId, context.userId);
  }

  // 5. Favorites & Recents
  async toggleFavorite(tenantId: string, reportId: string, context: RequestContext) {
    return this.repository.toggleFavorite(tenantId, context.userId, reportId);
  }

  async getFavorites(tenantId: string, context: RequestContext) {
    return this.repository.findFavorites(tenantId, context.userId);
  }

  async logRecentOpened(tenantId: string, reportId: string, context: RequestContext) {
    return this.repository.logRecentOpen(tenantId, context.userId, reportId);
  }

  async getRecentOpened(tenantId: string, context: RequestContext) {
    return this.repository.findRecent(tenantId, context.userId);
  }

  // 6. Scheduled Reports
  async createSchedule(tenantId: string, reportId: string, dto: CreateScheduledReportDto, context: RequestContext) {
    const schedule = await this.repository.createScheduledReport(tenantId, {
      reportDefinitionId: reportId,
      userId: context.userId,
      name: dto.name,
      frequency: dto.frequency,
      cronExpression: dto.cronExpression || null,
      deliveryMethods: dto.deliveryMethods,
      recipients: dto.recipients || '',
    });

    return schedule;
  }

  async triggerScheduledRun(tenantId: string, scheduleId: string, context: RequestContext) {
    const schedule = await this.repository.findScheduledReportById(tenantId, scheduleId);
    if (!schedule) throw new NotFoundException('Scheduled report configuration not found');

    const startedAt = new Date();
    const execution = await this.repository.createExecution(tenantId, {
      reportDefinitionId: schedule.reportDefinitionId,
      scheduledReportId: schedule.id,
      triggeredById: context.userId,
      status: 'RUNNING',
      startedAt,
    });

    // Simulate completion
    await new Promise((resolve) => setTimeout(resolve, 200));

    const completedAt = new Date();
    const duration = Math.ceil((completedAt.getTime() - startedAt.getTime()) / 1000);

    const updated = await this.repository.prisma.reportExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        completedAt,
        duration,
      },
    });

    return updated;
  }

  // 7. Global Enterprise Search
  async searchBI(tenantId: string, query: string, context: RequestContext) {
    const reports = await this.repository.findDefinitions(tenantId, undefined, query);
    const dashboards = await this.repository.prisma.dashboard.findMany({
      where: {
        tenantId,
        ownerId: context.userId,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
    });

    return {
      reports: reports.map((r) => ({ id: r.id, name: r.name, code: r.code, type: 'report' })),
      dashboards: dashboards.map((d) => ({ id: d.id, name: d.name, type: 'dashboard' })),
    };
  }
}
