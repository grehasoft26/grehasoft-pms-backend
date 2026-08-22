import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';
import { runTechnicalAuditOnPages } from '../utils/audit-engine.helper';
import { calculateSeoHealthScore } from '../utils/seo-score.helper';

@Injectable()
export class AuditsService {
  constructor(private readonly repository: SeoRepository) {}

  async runCrawlAudit(tenantId: string, seoProjectId: string) {
    const startTime = new Date();

    // 1. Simulate Page Contents
    const pages = [
      {
        urlPath: '/',
        title: 'Grehasoft Home',
        metaDescription:
          'Grehasoft Enterprise Resource Suite PMS software for business.',
        headings: [
          'H1: Grehasoft Home',
          'H2: Core features',
          'H2: Pricing details',
        ],
        images: [{ alt: 'Logo image banner', sizeBytes: 150000 }],
        links: ['/services', '/about', '/broken-link-url'],
        loadTimeMs: 450,
      },
      {
        urlPath: '/services',
        title: 'Grehasoft Services',
        metaDescription: '', // Missing meta description trigger
        headings: ['H2: Project Management solutions', 'H2: Finance solutions'], // Missing H1 trigger
        images: [{ alt: '', sizeBytes: 2500000 }], // Missing alt & Large Image trigger
        links: ['/'],
        loadTimeMs: 2500, // Slow Page speed trigger
      },
    ];

    // 2. Run crawl engine
    const findings = runTechnicalAuditOnPages(pages);

    // 3. Compute score
    const healthScore = calculateSeoHealthScore(
      findings.map((f) => ({ severity: f.severity, isResolved: false })),
    );

    const audit = await this.repository.createAudit(tenantId, {
      seoProjectId,
      healthScore,
      pagesCrawled: pages.length,
      startedAt: startTime,
      completedAt: new Date(),
    });

    for (const f of findings) {
      await this.repository.createAuditIssue(tenantId, {
        technicalAuditId: audit.id,
        urlPath: f.urlPath,
        issueType: f.issueType,
        severity: f.severity as any,
        description: f.description,
        isResolved: false,
      });

      // Automatically generate Recommendation actions for issues
      await this.repository.createRecommendation(tenantId, {
        seoProjectId,
        title: `Fix ${f.issueType.replace(/_/g, ' ')}`,
        description: f.description,
        priority:
          f.severity === 'CRITICAL' || f.severity === 'HIGH'
            ? 'HIGH'
            : f.severity === 'MEDIUM'
              ? 'MEDIUM'
              : 'LOW',
        impactScore:
          f.severity === 'CRITICAL' ? 95 : f.severity === 'HIGH' ? 80 : 50,
        isCompleted: false,
      });
    }

    // Log Crawl Path Details
    for (const p of pages) {
      await this.repository.prisma.crawlLog.create({
        data: {
          tenantId,
          seoProjectId,
          urlPath: p.urlPath,
          statusCode: p.loadTimeMs > 2200 ? 504 : 200,
          loadTimeMs: p.loadTimeMs,
          pageSizeBytes: p.images.reduce(
            (acc, img) => acc + img.sizeBytes,
            12000,
          ),
        },
      });
    }

    await this.repository.logAudit(
      tenantId,
      'Run Technical Audit',
      `Technical crawl completed. Health Score: ${healthScore}%. Found ${findings.length} issues.`,
    );
    return {
      auditId: audit.id,
      healthScore,
      findingsCount: findings.length,
      findings,
    };
  }

  async getAudits(tenantId: string, seoProjectId: string) {
    return this.repository.findAudits(tenantId, seoProjectId);
  }
}
