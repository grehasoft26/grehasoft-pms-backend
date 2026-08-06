import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';
import { CreateKeywordDto, CreateKeywordGroupDto } from '../dto/keywords.dto';
import { clusterKeywords } from '../utils/keyword-clustering.helper';

@Injectable()
export class KeywordsService {
  constructor(private readonly repository: SeoRepository) {}

  async createGroup(tenantId: string, seoProjectId: string, dto: CreateKeywordGroupDto) {
    return this.repository.createKeywordGroup(tenantId, {
      seoProjectId,
      name: dto.name,
    });
  }

  async getGroups(tenantId: string, seoProjectId: string) {
    return this.repository.findKeywordGroups(tenantId, seoProjectId);
  }

  async addKeyword(tenantId: string, seoProjectId: string, dto: CreateKeywordDto) {
    // Resolve search intent dynamically based on keywords if not provided
    let intent = dto.intent || 'INFORMATIONAL';
    const termLower = dto.term.toLowerCase();
    if (termLower.includes('buy') || termLower.includes('pricing') || termLower.includes('purchase')) {
      intent = 'TRANSACTIONAL';
    } else if (termLower.includes('vs') || termLower.includes('review') || termLower.includes('best')) {
      intent = 'COMMERCIAL';
    } else if (termLower.includes('login') || termLower.includes('grehasoft')) {
      intent = 'NAVIGATIONAL';
    }

    const keyword = await this.repository.createKeyword(tenantId, {
      seoProjectId,
      term: dto.term,
      intent,
      targetUrl: dto.targetUrl || null,
      searchVolume: dto.searchVolume || 0,
      cpc: dto.cpc || 0.00,
      difficulty: dto.difficulty || 0,
      status: 'TRACKING',
      groupId: dto.groupId || null,
    });

    await this.repository.logAudit(tenantId, 'Create Keyword', `Keyword ${dto.term} added to project.`);
    return keyword;
  }

  async getKeywords(tenantId: string, seoProjectId: string) {
    return this.repository.findKeywords(tenantId, seoProjectId);
  }

  async runKeywordClustering(tenantId: string, seoProjectId: string) {
    const keywords = await this.getKeywords(tenantId, seoProjectId);
    const terms = keywords.map((k) => k.term);
    const clusters = clusterKeywords(terms);

    for (const cluster of clusters) {
      // Find or create group
      let group = await this.repository.prisma.keywordGroup.findFirst({
        where: { tenantId, seoProjectId, name: cluster.groupName },
      });
      if (!group) {
        group = await this.repository.createKeywordGroup(tenantId, {
          seoProjectId,
          name: cluster.groupName,
        });
      }

      // Update keyword links
      const matchIds = keywords.filter((k) => cluster.terms.includes(k.term)).map((k) => k.id);
      await this.repository.prisma.keyword.updateMany({
        where: { id: { in: matchIds } },
        data: { groupId: group.id },
      });
    }

    await this.repository.logAudit(tenantId, 'Keyword Clustering', `Clustered keywords into ${clusters.length} silos.`);
    return clusters;
  }
}
