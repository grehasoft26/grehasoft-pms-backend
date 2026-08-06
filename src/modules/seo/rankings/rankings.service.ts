import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';

@Injectable()
export class RankingsService {
  constructor(private readonly repository: SeoRepository) {}

  async logRanking(tenantId: string, keywordId: string, position: number, engine: 'GOOGLE' | 'BING' = 'GOOGLE') {
    return this.repository.logKeywordRanking(tenantId, {
      keywordId,
      position,
      engine,
      trackedAt: new Date(),
    });
  }

  async getRankingHistory(tenantId: string, keywordId: string) {
    return this.repository.findKeywordRankings(tenantId, keywordId);
  }

  async getVisibilityScore(tenantId: string, seoProjectId: string) {
    const keywords = await this.repository.findKeywords(tenantId, seoProjectId);
    if (keywords.length === 0) return { visibilityScore: 0 };

    let countTop10 = 0;
    for (const kw of keywords) {
      const latestRank = await this.repository.prisma.keywordRanking.findFirst({
        where: { tenantId, keywordId: kw.id },
        orderBy: { trackedAt: 'desc' },
      });
      if (latestRank && latestRank.position <= 10) {
        countTop10++;
      }
    }

    const score = (countTop10 / keywords.length) * 100;
    return {
      totalKeywordsTracked: keywords.length,
      top10KeywordsCount: countTop10,
      visibilityScore: Math.round(score * 100) / 100,
    };
  }
}
