import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';

@Injectable()
export class PagesService {
  constructor(private readonly repository: SeoRepository) {}

  async upsertPageSEO(
    tenantId: string,
    seoProjectId: string,
    urlPath: string,
    data: any
  ) {
    const page = await this.repository.upsertPageSeo(tenantId, seoProjectId, urlPath, {
      title: data.title || '',
      metaDescription: data.metaDescription || '',
      canonicalUrl: data.canonicalUrl || '',
      robotsMeta: data.robotsMeta || 'index, follow',
      openGraphJson: data.openGraphJson || '{}',
      twitterCardJson: data.twitterCardJson || '{}',
      headingStructureJson: data.headingStructureJson || '[]',
      internalLinksCount: data.internalLinksCount || 0,
      externalLinksCount: data.externalLinksCount || 0,
      status: data.status || 'OPTIMIZED',
    });

    await this.repository.logAudit(tenantId, 'Upsert Page SEO', `SEO metadata updated for path ${urlPath}.`);
    return page;
  }

  async getPages(tenantId: string, seoProjectId: string) {
    return this.repository.findPagesSeo(tenantId, seoProjectId);
  }
}
