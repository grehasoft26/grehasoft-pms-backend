import { BadRequestException } from '@nestjs/common';

export interface QueryParams {
  tenantId: string;
  fields?: string[];
  filters?: Record<string, any>;
  sort?: { field: string; order: 'asc' | 'desc' }[];
  groupBy?: string[];
  aggregations?: {
    field: string;
    type: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  }[];
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
  dateField?: string;
  startDate?: Date;
  endDate?: Date;
  includes?: string[];
}

const modelsWithTenantId = new Set([
  'reportcategory',
  'reportdefinition',
  'reportversion',
  'widget',
  'dashboardtemplate',
  'dashboard',
  'dashboardwidget',
  'dashboardshare',
  'savedfilter',
  'scheduledreport',
  'reportexecution',
  'reportexport',
  'reportfavorite',
  'recentlyopenedreport',
  'analyticscache',
  'kpidefinition',
  'kpisnapshot',
  'businessalert',
  'analyticssnapshot',
  'analyticsinsight',
]);

const modelsWithDeletedAt = new Set([
  'lead',
  'opportunity',
  'project',
  'projectmember',
  'employeeprofile',
  'trainingenrollment',
  'deployment',
  'backup',
  'reportcategory',
  'reportdefinition',
  'reportversion',
  'widget',
  'dashboardtemplate',
  'dashboard',
  'dashboardwidget',
  'dashboardshare',
  'savedfilter',
  'scheduledreport',
  'reportexecution',
  'reportexport',
  'reportfavorite',
  'recentlyopenedreport',
  'analyticscache',
  'kpidefinition',
  'kpisnapshot',
  'businessalert',
  'analyticssnapshot',
  'analyticsinsight',
]);

export async function executeQuery(
  prisma: any,
  modelName: string,
  params: QueryParams,
): Promise<any[]> {
  const delegate = prisma[modelName];
  if (!delegate) {
    throw new BadRequestException(
      `Model delegate ${modelName} not found in Prisma client`,
    );
  }

  const where: Record<string, any> = {};

  // Strict tenant boundary enforcement if supported by model
  if (modelsWithTenantId.has(modelName.toLowerCase())) {
    where.tenantId = params.tenantId;
  }

  // Skip deleted records if audit fields exist on model
  if (modelsWithDeletedAt.has(modelName.toLowerCase())) {
    where.deletedAt = null;
  }

  // Combine custom filters
  if (params.filters) {
    for (const [key, val] of Object.entries(params.filters)) {
      if (val !== undefined && val !== null) {
        where[key] = val;
      }
    }
  }

  // Global search filtering
  if (params.search && params.searchFields && params.searchFields.length > 0) {
    where.OR = params.searchFields.map((f) => ({
      [f]: { contains: params.search },
    }));
  }

  // Date Presets & Custom Date Ranges
  if (params.dateField && (params.startDate || params.endDate)) {
    const range: Record<string, any> = {};
    if (params.startDate) range.gte = params.startDate;
    if (params.endDate) range.lte = params.endDate;
    where[params.dateField] = range;
  }

  // Group By & Aggregations Mode
  if (params.groupBy && params.groupBy.length > 0) {
    const groupOptions: any = {
      by: params.groupBy,
      where,
    };

    if (params.aggregations && params.aggregations.length > 0) {
      for (const agg of params.aggregations) {
        const key = `_${agg.type.toLowerCase()}`; // e.g. _sum, _count
        if (!groupOptions[key]) groupOptions[key] = {};
        groupOptions[key][agg.field] = true;
      }
    }

    return delegate.groupBy(groupOptions);
  }

  // Normal findMany query
  const queryOptions: any = { where };

  // Projections
  if (params.fields && params.fields.length > 0) {
    queryOptions.select = {};
    for (const f of params.fields) {
      queryOptions.select[f] = true;
    }
    // ensure relation fields are not selected directly as booleans if nested
  } else if (params.includes && params.includes.length > 0) {
    queryOptions.include = {};
    for (const inc of params.includes) {
      queryOptions.include[inc] = true;
    }
  }

  // Sorting
  if (params.sort && params.sort.length > 0) {
    queryOptions.orderBy = params.sort.map((s) => ({
      [s.field]: s.order,
    }));
  }

  // Paging limits safeguards
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 50; // default safe limit

  queryOptions.skip = (page - 1) * limit;
  queryOptions.take = limit;

  return delegate.findMany(queryOptions);
}
