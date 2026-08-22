import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';

@Injectable()
export class SitemapService {
  constructor(private readonly repository: SeoRepository) {}

  async generateXmlSitemap(
    tenantId: string,
    seoProjectId: string,
    domain: string,
    paths: string[],
  ) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const path of paths) {
      xml += `  <url>\n    <loc>https://${domain}${path}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${path === '/' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    }
    xml += `</urlset>`;

    const sitemapUrl = `https://${domain}/sitemap.xml`;
    const sitemap = await this.repository.upsertSitemap(
      tenantId,
      seoProjectId,
      sitemapUrl,
      xml,
    );

    await this.repository.logAudit(
      tenantId,
      'Generate Sitemap',
      `XML Sitemap generated for ${domain}.`,
    );
    return sitemap;
  }

  async getSitemaps(tenantId: string, seoProjectId: string) {
    return this.repository.findSitemaps(tenantId, seoProjectId);
  }
}
