import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsBuilderService } from '../services/reports.service';
import { CrmReportsService } from '../crm-reports/crm-reports.service';
import { ProjectReportsService } from '../project-reports/project-reports.service';
import { FinanceReportsService } from '../finance-reports/finance-reports.service';
import { HrReportsService } from '../hr-reports/hr-reports.service';
import { InfrastructureReportsService } from '../infrastructure-reports/infrastructure-reports.service';
import { ProductivityReportsService } from '../productivity-reports/productivity-reports.service';
import { CachingHelper } from '../utils/caching.helper';
import { executeQuery } from '../utils/query-engine.helper';
import { CreateReportDefinitionDto, PublishVersionDto, RollbackVersionDto, SaveFilterDto, CreateScheduledReportDto } from '../dto/reports.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PrismaService } from '../../../core/database/prisma.service';

@ApiTags('BI Reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly builderService: ReportsBuilderService,
    private readonly crmService: CrmReportsService,
    private readonly projectService: ProjectReportsService,
    private readonly financeService: FinanceReportsService,
    private readonly hrService: HrReportsService,
    private readonly infraService: InfrastructureReportsService,
    private readonly productivityService: ProductivityReportsService,
    private readonly cachingHelper: CachingHelper,
    private readonly prisma: PrismaService
  ) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  private getTenantId(req: Request): string {
    return (req.headers['x-tenant-id'] as string) || '00000000-0000-0000-0000-000000000000';
  }

  @Post('categories')
  @Permissions('reports.manage')
  @ApiOperation({ summary: 'Create a report category' })
  @ApiResponse({ type: SuccessResponseDto })
  async createCategory(@Body() body: { name: string; code: string }, @Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.createCategory(tenantId, body.name, body.code);
    return { message: 'Category created successfully', data };
  }

  @Get('categories')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get report categories' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCategories(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.getCategories(tenantId);
    return { message: 'Categories retrieved successfully', data };
  }

  @Post('definitions')
  @Permissions('reports.manage')
  @ApiOperation({ summary: 'Create report definition (dynamic query fields, module schemas)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createDefinition(@Body() dto: CreateReportDefinitionDto, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.createReportDefinition(tenantId, dto, context);
    return { message: 'Report definition created successfully', data };
  }

  @Get('definitions')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get list of report definitions' })
  @ApiResponse({ type: SuccessResponseDto })
  async getDefinitions(
    @Req() req: Request,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string
  ) {
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.getReportDefinitions(tenantId, categoryId, search);
    return { message: 'Report definitions retrieved', data };
  }

  @Get('search')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Global enterprise search across reports and dashboards' })
  @ApiResponse({ type: SuccessResponseDto })
  async search(@Query('query') query: string, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.searchBI(tenantId, query, context);
    return { message: 'Search results compiled', data };
  }

  @Post('definitions/:id/versions')
  @Permissions('reports.manage')
  @ApiOperation({ summary: 'Publish a new report definition version' })
  @ApiResponse({ type: SuccessResponseDto })
  async publishVersion(
    @Param('id') id: string,
    @Body() dto: PublishVersionDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.publishVersion(tenantId, id, dto, context);
    return { message: 'New version published successfully', data };
  }

  @Post('definitions/:id/rollback')
  @Permissions('reports.manage')
  @ApiOperation({ summary: 'Rollback report definition to a previous version' })
  @ApiResponse({ type: SuccessResponseDto })
  async rollbackVersion(
    @Param('id') id: string,
    @Body() dto: RollbackVersionDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.rollbackVersion(tenantId, id, dto.version, context);
    return { message: 'Version rolled back successfully', data };
  }

  @Post('definitions/:id/favorite')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Pin/unpin favorite report definition' })
  @ApiResponse({ type: SuccessResponseDto })
  async toggleFavorite(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.toggleFavorite(tenantId, id, context);
    return { message: 'Favorite status toggled', data };
  }

  @Get('favorites')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get list of favorite reports' })
  @ApiResponse({ type: SuccessResponseDto })
  async getFavorites(@Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.getFavorites(tenantId, context);
    return { message: 'Favorites retrieved successfully', data };
  }

  @Get('recent')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get list of recently opened reports' })
  @ApiResponse({ type: SuccessResponseDto })
  async getRecent(@Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.getRecentOpened(tenantId, context);
    return { message: 'Recent reports retrieved successfully', data };
  }

  @Post('definitions/:id/filters')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Save custom filter presets for report' })
  @ApiResponse({ type: SuccessResponseDto })
  async saveFilter(
    @Param('id') id: string,
    @Body() dto: SaveFilterDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.saveFilter(tenantId, id, dto, context);
    return { message: 'Filter preset saved successfully', data };
  }

  @Get('definitions/:id/filters')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Get saved filter presets for report definition' })
  @ApiResponse({ type: SuccessResponseDto })
  async getFilters(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.getSavedFilters(tenantId, id, context);
    return { message: 'Filter presets retrieved', data };
  }

  @Post('definitions/:id/schedules')
  @Permissions('reports.manage')
  @ApiOperation({ summary: 'Configure report scheduled run options' })
  @ApiResponse({ type: SuccessResponseDto })
  async createSchedule(
    @Param('id') id: string,
    @Body() dto: CreateScheduledReportDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.createSchedule(tenantId, id, dto, context);
    return { message: 'Report schedule defined successfully', data };
  }

  @Post('schedules/:id/run')
  @Permissions('reports.manage')
  @ApiOperation({ summary: 'Manual trigger of scheduled report execution' })
  @ApiResponse({ type: SuccessResponseDto })
  async runSchedule(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);
    const data = await this.builderService.triggerScheduledRun(tenantId, id, context);
    return { message: 'Scheduled report ran successfully', data };
  }

  // Execute Dynamic Query Engine reports with Caching layer
  @Post('definitions/:id/run')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Execute dynamic query builder report with cache layer' })
  @ApiResponse({ type: SuccessResponseDto })
  async runReport(
    @Param('id') id: string,
    @Body() body: { filters?: any; page?: number; limit?: number },
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const tenantId = this.getTenantId(req);

    // Track recently opened report definition
    await this.builderService.logRecentOpened(tenantId, id, context).catch(() => {});

    // Hash filters
    const filterHash = this.cachingHelper.generateHash(body.filters);

    // Cache lookup
    const cached = await this.cachingHelper.getCache(tenantId, id, filterHash);
    if (cached) {
      return { message: 'Report executed successfully (Cache Hit)', data: cached };
    }

    // DB Fallback query definition details
    const report = await this.builderService.getReportDefinitions(tenantId, undefined);
    const target = report.find((r) => r.id === id);
    if (!target) {
      throw new BadRequestException('Report definition not found');
    }

    const fields = target.fieldsJson ? JSON.parse(target.fieldsJson) : [];
    const dbFilters = target.filtersJson ? JSON.parse(target.filtersJson) : {};

    // Execute dynamic Query Engine
    const data = await executeQuery(this.prisma, target.module.toLowerCase(), {
      tenantId,
      fields,
      filters: { ...dbFilters, ...(body.filters || {}) },
      page: body.page,
      limit: body.limit,
    });

    // Save cache
    await this.cachingHelper.setCache(tenantId, id, filterHash, data);

    return { message: 'Report executed successfully (Cache Miss)', data };
  }

  // Cross-Module Reporting APIs
  @Get('crm/conversion')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'CRM Lead conversion rates report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCrmConversion(@Req() req: Request, @Query('statusId') statusId?: string) {
    const tenantId = this.getTenantId(req);
    const filters = statusId ? { statusId } : {};
    const data = await this.crmService.getLeadConversion(tenantId, filters);
    return { message: 'CRM leads conversion compiled', data };
  }

  @Get('crm/funnel')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'CRM Opportunity pipeline funnel stages report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCrmFunnel(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.crmService.getSalesFunnel(tenantId, {});
    return { message: 'CRM pipeline funnel retrieved', data };
  }

  @Get('crm/winrate')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'CRM Closed Win Rate opportunities report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCrmWinRate(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.crmService.getOpportunityWinRate(tenantId, {});
    return { message: 'CRM win rate calculated', data };
  }

  @Get('projects/health')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Projects health status report (GREEN, RED, YELLOW)' })
  @ApiResponse({ type: SuccessResponseDto })
  async getProjectHealth(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.projectService.getProjectHealth(tenantId, {});
    return { message: 'Projects health compiled', data };
  }

  @Get('projects/delayed')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Delayed projects list report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getDelayedProjects(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.projectService.getDelayedProjects(tenantId, {});
    return { message: 'Delayed projects lists compiled', data };
  }

  @Get('projects/utilization')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Resource utilization report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getResourceUtilization(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.projectService.getResourceUtilization(tenantId, {});
    return { message: 'Resource utilization calculated', data };
  }

  @Get('finance/summary')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Finance revenue vs expenses, outstanding profit margins report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getFinanceSummary(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.financeService.getRevenueAndExpenses(tenantId, {});
    return { message: 'Finance revenue and expenses metrics retrieved', data };
  }

  @Get('finance/cashflow')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Finance cash inflow and outflow cashflow report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getFinanceCashflow(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.financeService.getCashFlow(tenantId, {});
    return { message: 'Finance cashflow metrics compiled', data };
  }

  @Get('hr/attrition')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'HR active headcounts and attrition turnover rates report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getHrAttrition(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.hrService.getEmployeeAttrition(tenantId, {});
    return { message: 'HR attritions statistics calculated', data };
  }

  @Get('hr/training')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'HR corporate training completed vs pending enrollments report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getHrTraining(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.hrService.getTrainingMetrics(tenantId, {});
    return { message: 'HR training statistics compiled', data };
  }

  @Get('infrastructure/deployments')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Infrastructure deployments speed and success rates report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getInfraDeployments(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.infraService.getDeploymentsMetrics(tenantId, {});
    return { message: 'DevOps deployments metrics calculated', data };
  }

  @Get('infrastructure/backups')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Infrastructure backups success rates metrics report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getInfraBackups(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.infraService.getBackupsMetrics(tenantId, {});
    return { message: 'DevOps backups success rate retrieved', data };
  }

  @Get('productivity/metrics')
  @Permissions('reports.read')
  @ApiOperation({ summary: 'Productivity billable vs non-billable hours utilization report' })
  @ApiResponse({ type: SuccessResponseDto })
  async getProductivityMetrics(@Req() req: Request) {
    const tenantId = this.getTenantId(req);
    const data = await this.productivityService.getProductivityMetrics(tenantId, {});
    return { message: 'Productivity hours metrics compiled', data };
  }
}
