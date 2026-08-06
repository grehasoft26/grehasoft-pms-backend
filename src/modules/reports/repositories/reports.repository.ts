import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, SharePermission } from '@prisma/client';

@Injectable()
export class ReportsRepository {
  constructor(public readonly prisma: PrismaService) {}

  // Tenant bound filter builder
  private tenantWhere(tenantId: string, customWhere: any = {}) {
    return {
      tenantId,
      deletedAt: null,
      ...customWhere,
    };
  }

  // Categories
  async createCategory(tenantId: string, data: any) {
    return this.prisma.reportCategory.create({
      data: { tenantId, ...data },
    });
  }

  async findCategories(tenantId: string) {
    return this.prisma.reportCategory.findMany({
      where: this.tenantWhere(tenantId),
    });
  }

  async findCategoryById(tenantId: string, id: string) {
    return this.prisma.reportCategory.findFirst({
      where: this.tenantWhere(tenantId, { id }),
    });
  }

  // Definitions
  async createDefinition(tenantId: string, data: any) {
    return this.prisma.reportDefinition.create({
      data: { tenantId, ...data },
    });
  }

  async updateDefinition(tenantId: string, id: string, data: any) {
    return this.prisma.reportDefinition.update({
      where: { id },
      data,
    });
  }

  async findDefinitions(tenantId: string, categoryId?: string, search?: string) {
    const where: any = this.tenantWhere(tenantId);
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }
    return this.prisma.reportDefinition.findMany({ where, include: { category: true } });
  }

  async findDefinitionById(tenantId: string, id: string) {
    return this.prisma.reportDefinition.findFirst({
      where: this.tenantWhere(tenantId, { id }),
      include: { category: true, versions: true },
    });
  }

  async findDefinitionByCode(tenantId: string, code: string) {
    return this.prisma.reportDefinition.findFirst({
      where: this.tenantWhere(tenantId, { code }),
    });
  }

  // Versions
  async createVersion(tenantId: string, data: any) {
    return this.prisma.reportVersion.create({
      data: { tenantId, ...data },
    });
  }

  async findVersions(tenantId: string, reportDefinitionId: string) {
    return this.prisma.reportVersion.findMany({
      where: this.tenantWhere(tenantId, { reportDefinitionId }),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findVersionBySemver(tenantId: string, reportDefinitionId: string, version: string) {
    return this.prisma.reportVersion.findFirst({
      where: this.tenantWhere(tenantId, { reportDefinitionId, version }),
    });
  }

  // Widgets & Templates
  async findWidgetByCode(code: string) {
    return this.prisma.widget.findUnique({ where: { code } });
  }

  async findTemplateByCode(code: string) {
    return this.prisma.dashboardTemplate.findUnique({ where: { code } });
  }

  // Dashboards
  async createDashboard(tenantId: string, data: any) {
    return this.prisma.dashboard.create({
      data: { tenantId, ...data },
    });
  }

  async updateDashboard(tenantId: string, id: string, data: any) {
    return this.prisma.dashboard.update({
      where: { id },
      data,
    });
  }

  async findDashboards(tenantId: string, userId: string) {
    // Return custom owner dashboards or shared with user/roles
    return this.prisma.dashboard.findMany({
      where: this.tenantWhere(tenantId, {
        OR: [
          { ownerId: userId },
          { shares: { some: { userId } } },
        ],
      }),
      include: { owner: true, widgets: { include: { widget: true } } },
    });
  }

  async findDashboardById(tenantId: string, id: string) {
    return this.prisma.dashboard.findFirst({
      where: this.tenantWhere(tenantId, { id }),
      include: { widgets: { include: { widget: true } }, shares: true },
    });
  }

  async createDashboardWidget(tenantId: string, data: any) {
    return this.prisma.dashboardWidget.create({
      data: { tenantId, ...data },
    });
  }

  async createDashboardShare(tenantId: string, data: any) {
    return this.prisma.dashboardShare.create({
      data: { tenantId, ...data },
    });
  }

  async findDashboardShares(tenantId: string, dashboardId: string) {
    return this.prisma.dashboardShare.findMany({
      where: this.tenantWhere(tenantId, { dashboardId }),
    });
  }

  // Saved Filters
  async createSavedFilter(tenantId: string, data: any) {
    return this.prisma.savedFilter.create({
      data: { tenantId, ...data },
    });
  }

  async findSavedFilters(tenantId: string, reportDefinitionId: string, userId: string) {
    return this.prisma.savedFilter.findMany({
      where: this.tenantWhere(tenantId, {
        reportDefinitionId,
        OR: [
          { scope: 'GLOBAL' },
          { userId },
        ],
      }),
    });
  }

  // Scheduled Reports
  async createScheduledReport(tenantId: string, data: any) {
    return this.prisma.scheduledReport.create({
      data: { tenantId, ...data },
    });
  }

  async findScheduledReports(tenantId: string) {
    return this.prisma.scheduledReport.findMany({
      where: this.tenantWhere(tenantId),
      include: { reportDefinition: true },
    });
  }

  async findScheduledReportById(tenantId: string, id: string) {
    return this.prisma.scheduledReport.findFirst({
      where: this.tenantWhere(tenantId, { id }),
    });
  }

  async createExecution(tenantId: string, data: any) {
    return this.prisma.reportExecution.create({
      data: { tenantId, ...data },
    });
  }

  // Exports
  async createExport(tenantId: string, data: any) {
    return this.prisma.reportExport.create({
      data: { tenantId, ...data },
    });
  }

  async updateExport(tenantId: string, id: string, data: any) {
    return this.prisma.reportExport.update({
      where: { id },
      data,
    });
  }

  async findExports(tenantId: string) {
    return this.prisma.reportExport.findMany({
      where: this.tenantWhere(tenantId),
      orderBy: { startedAt: 'desc' },
    });
  }

  async findExportById(tenantId: string, id: string) {
    return this.prisma.reportExport.findFirst({
      where: this.tenantWhere(tenantId, { id }),
    });
  }

  // KPIs
  async findKpis(tenantId: string) {
    return this.prisma.kpiDefinition.findMany({
      where: this.tenantWhere(tenantId),
    });
  }

  async findKpiByCode(tenantId: string, code: string) {
    return this.prisma.kpiDefinition.findFirst({
      where: this.tenantWhere(tenantId, { code }),
    });
  }

  async recordKpiSnapshot(tenantId: string, kpiDefinitionId: string, value: number) {
    return this.prisma.kpiSnapshot.create({
      data: {
        tenantId,
        kpiDefinitionId,
        value,
      },
    });
  }

  async findKpiSnapshots(tenantId: string, kpiDefinitionId: string) {
    return this.prisma.kpiSnapshot.findMany({
      where: this.tenantWhere(tenantId, { kpiDefinitionId }),
      orderBy: { recordedAt: 'asc' },
    });
  }

  // Business Alerts
  async createAlert(tenantId: string, data: any) {
    return this.prisma.businessAlert.create({
      data: { tenantId, ...data },
    });
  }

  async findAlerts(tenantId: string) {
    return this.prisma.businessAlert.findMany({
      where: this.tenantWhere(tenantId),
      orderBy: { triggeredAt: 'desc' },
    });
  }

  // Favorites & Recent
  async toggleFavorite(tenantId: string, userId: string, reportDefinitionId: string) {
    const existing = await this.prisma.reportFavorite.findFirst({
      where: { tenantId, userId, reportDefinitionId },
    });
    if (existing) {
      await this.prisma.reportFavorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await this.prisma.reportFavorite.create({
      data: { tenantId, userId, reportDefinitionId },
    });
    return { favorited: true };
  }

  async logRecentOpen(tenantId: string, userId: string, reportDefinitionId: string) {
    return this.prisma.recentlyOpenedReport.create({
      data: { tenantId, userId, reportDefinitionId },
    });
  }

  async findFavorites(tenantId: string, userId: string) {
    return this.prisma.reportFavorite.findMany({
      where: { tenantId, userId },
      include: { reportDefinition: true },
    });
  }

  async findRecent(tenantId: string, userId: string) {
    return this.prisma.recentlyOpenedReport.findMany({
      where: { tenantId, userId },
      include: { reportDefinition: true },
      orderBy: { openedAt: 'desc' },
      take: 10,
    });
  }
}
