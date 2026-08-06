import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly repository: SeoRepository) {}

  async importGoogleSearchConsoleMetrics(
    tenantId: string,
    seoProjectId: string,
    siteUrl: string,
    metrics: { clicks: number; impressions: number; ctr: number; position: number }
  ) {
    const property = await this.repository.upsertSearchConsole(tenantId, seoProjectId, {
      siteUrl,
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      ctr: metrics.ctr,
      position: metrics.position,
    });

    await this.repository.logAudit(tenantId, 'Import GSC Metrics', `Search Console metrics imported for site ${siteUrl}.`);
    return property;
  }

  async getSearchConsoleProperties(tenantId: string, seoProjectId: string) {
    return this.repository.findSearchConsole(tenantId, seoProjectId);
  }

  async importGoogleAnalyticsMetrics(
    tenantId: string,
    seoProjectId: string,
    measurementId: string,
    metrics: { activeUsers: number; sessions: number; bounceRate: number }
  ) {
    const property = await this.repository.upsertAnalyticsProperty(tenantId, seoProjectId, {
      measurementId,
      activeUsers: metrics.activeUsers,
      sessions: metrics.sessions,
      bounceRate: metrics.bounceRate,
    });

    await this.repository.logAudit(tenantId, 'Import GA4 Metrics', `Google Analytics 4 metrics imported for measurement ID ${measurementId}.`);
    return property;
  }

  async getAnalyticsProperties(tenantId: string, seoProjectId: string) {
    return this.repository.findAnalyticsProperties(tenantId, seoProjectId);
  }
}
