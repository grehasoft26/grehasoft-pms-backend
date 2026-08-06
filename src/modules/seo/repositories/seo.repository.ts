import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { SearchEngine, RedirectType, SchemaType } from '@prisma/client';

@Injectable()
export class SeoRepository {
  private readonly logger = new Logger('SEO_AUDIT');

  constructor(public readonly prisma: PrismaService) {}

  async logAudit(tenantId: string, action: string, details: string) {
    this.logger.log(`[Tenant: ${tenantId}] [Action: ${action}] - ${details}`);
    try {
      await this.prisma.notificationAudit.create({
        data: {
          tenantId,
          action,
          details,
        },
      });
    } catch (e) {
      this.logger.error('Failed to log audit details to database:', e);
    }
  }

  private tenantWhere(tenantId: string, customWhere: any = {}) {
    return {
      tenantId,
      deletedAt: null,
      ...customWhere,
    };
  }

  // SEO Projects
  async createProject(tenantId: string, data: any) {
    return this.prisma.sEOProject.create({
      data: { tenantId, ...data },
    });
  }

  async findProjects(tenantId: string) {
    return this.prisma.sEOProject.findMany({
      where: this.tenantWhere(tenantId),
    });
  }

  async findProjectById(tenantId: string, id: string) {
    return this.prisma.sEOProject.findFirst({
      where: this.tenantWhere(tenantId, { id }),
    });
  }

  // Keywords
  async createKeyword(tenantId: string, data: any) {
    return this.prisma.keyword.create({
      data: { tenantId, ...data },
    });
  }

  async findKeywords(tenantId: string, seoProjectId: string) {
    return this.prisma.keyword.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
      include: { group: true },
    });
  }

  async createKeywordGroup(tenantId: string, data: any) {
    return this.prisma.keywordGroup.create({
      data: { tenantId, ...data },
    });
  }

  async findKeywordGroups(tenantId: string, seoProjectId: string) {
    return this.prisma.keywordGroup.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  async logKeywordRanking(tenantId: string, data: any) {
    return this.prisma.keywordRanking.create({
      data: { tenantId, ...data },
    });
  }

  async findKeywordRankings(tenantId: string, keywordId: string) {
    return this.prisma.keywordRanking.findMany({
      where: this.tenantWhere(tenantId, { keywordId }),
      orderBy: { trackedAt: 'desc' },
    });
  }

  // Page SEO
  async upsertPageSeo(tenantId: string, seoProjectId: string, urlPath: string, data: any) {
    const existing = await this.prisma.pageSEO.findFirst({
      where: { tenantId, seoProjectId, urlPath },
    });
    if (existing) {
      return this.prisma.pageSEO.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.pageSEO.create({
      data: { tenantId, seoProjectId, urlPath, ...data },
    });
  }

  async findPagesSeo(tenantId: string, seoProjectId: string) {
    return this.prisma.pageSEO.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  // Audits & Issues
  async createAudit(tenantId: string, data: any) {
    return this.prisma.technicalAudit.create({
      data: { tenantId, ...data },
    });
  }

  async findAudits(tenantId: string, seoProjectId: string) {
    return this.prisma.technicalAudit.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
      include: { issues: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  async createAuditIssue(tenantId: string, data: any) {
    return this.prisma.auditIssue.create({
      data: { tenantId, ...data },
    });
  }

  // Backlinks
  async createBacklink(tenantId: string, data: any) {
    return this.prisma.backlink.create({
      data: { tenantId, ...data },
    });
  }

  async findBacklinks(tenantId: string, seoProjectId: string) {
    return this.prisma.backlink.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  async createBrokenLink(tenantId: string, data: any) {
    return this.prisma.brokenLink.create({
      data: { tenantId, ...data },
    });
  }

  async findBrokenLinks(tenantId: string, seoProjectId: string) {
    return this.prisma.brokenLink.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  // Redirects
  async createRedirect(tenantId: string, data: any) {
    return this.prisma.redirect.create({
      data: { tenantId, ...data },
    });
  }

  async findRedirects(tenantId: string, seoProjectId: string) {
    return this.prisma.redirect.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  // Sitemap & Robots
  async upsertSitemap(tenantId: string, seoProjectId: string, sitemapUrl: string, xmlContent: string) {
    const existing = await this.prisma.sitemap.findFirst({
      where: { tenantId, seoProjectId, sitemapUrl },
    });
    if (existing) {
      return this.prisma.sitemap.update({
        where: { id: existing.id },
        data: { xmlContent },
      });
    }
    return this.prisma.sitemap.create({
      data: { tenantId, seoProjectId, sitemapUrl, xmlContent },
    });
  }

  async findSitemaps(tenantId: string, seoProjectId: string) {
    return this.prisma.sitemap.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  async upsertRobots(tenantId: string, seoProjectId: string, content: string) {
    const existing = await this.prisma.robotsTxt.findFirst({
      where: { tenantId, seoProjectId },
    });
    if (existing) {
      return this.prisma.robotsTxt.update({
        where: { id: existing.id },
        data: { content },
      });
    }
    return this.prisma.robotsTxt.create({
      data: { tenantId, seoProjectId, content },
    });
  }

  async findRobots(tenantId: string, seoProjectId: string) {
    return this.prisma.robotsTxt.findFirst({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  // Schema Markup
  async upsertSchemaMarkup(tenantId: string, seoProjectId: string, urlPath: string, type: SchemaType, jsonLdContent: string) {
    const existing = await this.prisma.schemaMarkup.findFirst({
      where: { tenantId, seoProjectId, urlPath, type },
    });
    if (existing) {
      return this.prisma.schemaMarkup.update({
        where: { id: existing.id },
        data: { jsonLdContent },
      });
    }
    return this.prisma.schemaMarkup.create({
      data: { tenantId, seoProjectId, urlPath, type, jsonLdContent },
    });
  }

  async findSchemaMarkups(tenantId: string, seoProjectId: string) {
    return this.prisma.schemaMarkup.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  // Recommendations & Reports
  async createRecommendation(tenantId: string, data: any) {
    return this.prisma.sEORecommendation.create({
      data: { tenantId, ...data },
    });
  }

  async findRecommendations(tenantId: string, seoProjectId: string) {
    return this.prisma.sEORecommendation.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  async createReport(tenantId: string, data: any) {
    return this.prisma.sEOReport.create({
      data: { tenantId, ...data },
    });
  }

  async findReports(tenantId: string, seoProjectId: string) {
    return this.prisma.sEOReport.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  // Competitors
  async createCompetitor(tenantId: string, data: any) {
    return this.prisma.competitor.create({
      data: { tenantId, ...data },
    });
  }

  async findCompetitors(tenantId: string, seoProjectId: string) {
    return this.prisma.competitor.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
      include: { keywords: true },
    });
  }

  async createCompetitorKeyword(tenantId: string, data: any) {
    return this.prisma.competitorKeyword.create({
      data: { tenantId, ...data },
    });
  }

  // Integrations properties
  async upsertSearchConsole(tenantId: string, seoProjectId: string, data: any) {
    const existing = await this.prisma.googleSearchConsoleProperty.findFirst({
      where: { tenantId, seoProjectId, siteUrl: data.siteUrl },
    });
    if (existing) {
      return this.prisma.googleSearchConsoleProperty.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.googleSearchConsoleProperty.create({
      data: { tenantId, seoProjectId, ...data },
    });
  }

  async findSearchConsole(tenantId: string, seoProjectId: string) {
    return this.prisma.googleSearchConsoleProperty.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }

  async upsertAnalyticsProperty(tenantId: string, seoProjectId: string, data: any) {
    const existing = await this.prisma.googleAnalyticsProperty.findFirst({
      where: { tenantId, seoProjectId, measurementId: data.measurementId },
    });
    if (existing) {
      return this.prisma.googleAnalyticsProperty.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.googleAnalyticsProperty.create({
      data: { tenantId, seoProjectId, ...data },
    });
  }

  async findAnalyticsProperties(tenantId: string, seoProjectId: string) {
    return this.prisma.googleAnalyticsProperty.findMany({
      where: this.tenantWhere(tenantId, { seoProjectId }),
    });
  }
}
