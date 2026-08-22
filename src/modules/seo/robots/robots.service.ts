import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';

@Injectable()
export class RobotsService {
  constructor(private readonly repository: SeoRepository) {}

  async generateRobots(
    tenantId: string,
    seoProjectId: string,
    domain: string,
    disallows: string[],
  ) {
    let content = `User-agent: *\n`;
    for (const d of disallows) {
      content += `Disallow: ${d}\n`;
    }
    content += `Sitemap: https://${domain}/sitemap.xml\n`;

    const robots = await this.repository.upsertRobots(
      tenantId,
      seoProjectId,
      content,
    );
    await this.repository.logAudit(
      tenantId,
      'Generate Robots.txt',
      `Robots.txt updated for ${domain}.`,
    );
    return robots;
  }

  async getRobots(tenantId: string, seoProjectId: string) {
    return this.repository.findRobots(tenantId, seoProjectId);
  }
}
