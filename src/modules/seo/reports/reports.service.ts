import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly repository: SeoRepository) {}

  async createReport(tenantId: string, seoProjectId: string, title: string, userId: string) {
    const report = await this.repository.createReport(tenantId, {
      seoProjectId,
      title,
      reportUrl: `/downloads/reports/seo_${Date.now()}.pdf`,
      createdById: userId,
    });

    await this.repository.logAudit(tenantId, 'Create SEO Report', `Report ${title} generated.`);
    return report;
  }

  async getReports(tenantId: string, seoProjectId: string) {
    return this.repository.findReports(tenantId, seoProjectId);
  }
}
