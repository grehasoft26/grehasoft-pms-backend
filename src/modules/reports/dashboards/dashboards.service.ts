import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ReportsRepository } from '../repositories/reports.repository';
import { CreateDashboardDto, ShareDashboardDto, AddWidgetDto } from '../dto/dashboards.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class DashboardsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly logger: LoggerService
  ) {}

  async createDashboard(tenantId: string, dto: CreateDashboardDto, context: RequestContext) {
    let layoutJson = '[]';
    let templateId: string | null = null;

    if (dto.templateId) {
      const template = await this.repository.prisma.dashboardTemplate.findUnique({
        where: { id: dto.templateId },
      });
      if (template) {
        layoutJson = template.layoutJson;
        templateId = template.id;
      }
    }

    const dashboard = await this.repository.createDashboard(tenantId, {
      name: dto.name,
      description: dto.description || '',
      type: dto.type || 'CUSTOM',
      templateId,
      ownerId: context.userId,
      refreshInterval: dto.refreshInterval || 'MANUAL',
    });

    // Populate widgets from template layout if present
    if (layoutJson !== '[]') {
      try {
        const layoutWidgets = JSON.parse(layoutJson);
        for (const item of layoutWidgets) {
          const widget = await this.repository.findWidgetByCode(item.widgetCode);
          if (widget) {
            await this.repository.createDashboardWidget(tenantId, {
              dashboardId: dashboard.id,
              widgetId: widget.id,
              title: item.title || widget.name,
              xPos: item.x || 0,
              yPos: item.y || 0,
              width: item.w || 4,
              height: item.h || 3,
            });
          }
        }
      } catch (err) {
        // ignore malformed layouts JSON
      }
    }

    this.logger.audit(context.userId, 'Create Dashboard', 'dashboard', dashboard, { after: dashboard });
    return dashboard;
  }

  async getDashboards(tenantId: string, context: RequestContext) {
    return this.repository.findDashboards(tenantId, context.userId);
  }

  async getDashboard(tenantId: string, id: string, context: RequestContext) {
    const dashboard = await this.repository.findDashboardById(tenantId, id);
    if (!dashboard) throw new NotFoundException('Dashboard not found');

    // Security validation: verify owner or share options
    const isOwner = dashboard.ownerId === context.userId;
    const isShared = dashboard.shares.some((share) => {
      return (
        share.userId === context.userId ||
        (share.roleId && context.userId === share.userId) // simplifed role validation
      );
    });

    if (!isOwner && !isShared && dashboard.type !== 'EXECUTIVE') {
      throw new ForbiddenException('Access to this dashboard is restricted');
    }

    return dashboard;
  }

  async shareDashboard(tenantId: string, id: string, dto: ShareDashboardDto, context: RequestContext) {
    const dashboard = await this.getDashboard(tenantId, id, context);
    if (dashboard.ownerId !== context.userId) {
      throw new ForbiddenException('Only the owner can share this dashboard');
    }

    const share = await this.repository.createDashboardShare(tenantId, {
      dashboardId: id,
      userId: dto.userId,
      roleId: dto.roleId,
      departmentId: dto.departmentId,
      permission: dto.permission,
    });

    this.logger.audit(context.userId, 'Share Dashboard', 'dashboardShare', share, { after: share });
    return share;
  }

  async addWidget(tenantId: string, id: string, dto: AddWidgetDto, context: RequestContext) {
    const dashboard = await this.getDashboard(tenantId, id, context);

    const widget = await this.repository.createDashboardWidget(tenantId, {
      dashboardId: id,
      widgetId: dto.widgetId,
      title: dto.title,
      xPos: dto.xPos ?? 0,
      yPos: dto.yPos ?? 0,
      width: dto.width ?? 4,
      height: dto.height ?? 3,
      overrideConfigJson: dto.overrideConfigJson,
      drillDownMetadata: dto.drillDownMetadata,
    });

    this.logger.audit(context.userId, 'Add Dashboard Widget', 'dashboardWidget', widget, { after: widget });
    return widget;
  }

  async togglePin(tenantId: string, id: string, isPinned: boolean, context: RequestContext) {
    const dashboard = await this.getDashboard(tenantId, id, context);
    const updated = await this.repository.updateDashboard(tenantId, id, { isPinned });
    return updated;
  }

  // Templates & Widgets fetch
  async getTemplates() {
    return this.repository.prisma.dashboardTemplate.findMany();
  }

  async getWidgets() {
    return this.repository.prisma.widget.findMany();
  }
}
