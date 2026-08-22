import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';

@Injectable()
export class BacklinksService {
  constructor(private readonly repository: SeoRepository) {}

  async addBacklink(tenantId: string, seoProjectId: string, data: any) {
    const link = await this.repository.createBacklink(tenantId, {
      seoProjectId,
      sourceUrl: data.sourceUrl,
      targetUrl: data.targetUrl,
      domainAuthority: data.domainAuthority || 0,
      spamScore: data.spamScore || 0,
      anchorText: data.anchorText || '',
      type: data.type || 'DOFOLLOW',
    });

    await this.repository.logAudit(
      tenantId,
      'Add Backlink',
      `Backlink logged from domain ${data.sourceUrl}.`,
    );
    return link;
  }

  async getBacklinks(tenantId: string, seoProjectId: string) {
    return this.repository.findBacklinks(tenantId, seoProjectId);
  }

  async reportBrokenLink(
    tenantId: string,
    seoProjectId: string,
    sourceUrl: string,
    targetUrl: string,
    statusCode: number,
  ) {
    const link = await this.repository.createBrokenLink(tenantId, {
      seoProjectId,
      sourceUrl,
      targetUrl,
      statusCode,
    });

    await this.repository.logAudit(
      tenantId,
      'Report Broken Link',
      `Broken link detected: ${targetUrl} (Status ${statusCode})`,
    );
    return link;
  }

  async getBrokenLinks(tenantId: string, seoProjectId: string) {
    return this.repository.findBrokenLinks(tenantId, seoProjectId);
  }
}
