import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';

@Injectable()
export class CompetitorsService {
  constructor(private readonly repository: SeoRepository) {}

  async addCompetitor(
    tenantId: string,
    seoProjectId: string,
    name: string,
    domain: string,
  ) {
    const comp = await this.repository.createCompetitor(tenantId, {
      seoProjectId,
      name,
      domain,
    });

    await this.repository.logAudit(
      tenantId,
      'Add Competitor',
      `Competitor site ${domain} added.`,
    );
    return comp;
  }

  async logCompetitorKeyword(
    tenantId: string,
    competitorId: string,
    term: string,
    position: number,
    searchVolume = 0,
  ) {
    return this.repository.createCompetitorKeyword(tenantId, {
      competitorId,
      term,
      position,
      searchVolume,
      trackedAt: new Date(),
    });
  }

  async compareVisibility(tenantId: string, seoProjectId: string) {
    const competitors = await this.repository.findCompetitors(
      tenantId,
      seoProjectId,
    );
    const comparison = [];

    for (const comp of competitors) {
      const top10 = comp.keywords.filter((k) => k.position <= 10).length;
      const score =
        comp.keywords.length > 0 ? (top10 / comp.keywords.length) * 100 : 0;
      comparison.push({
        competitorName: comp.name,
        domain: comp.domain,
        totalKeywords: comp.keywords.length,
        top10Keywords: top10,
        visibilityScore: Math.round(score * 100) / 100,
      });
    }

    return comparison;
  }
}
