export interface PageContentSimulated {
  urlPath: string;
  title: string;
  metaDescription?: string;
  headings: string[];
  images: { alt?: string; sizeBytes: number }[];
  links: string[];
  loadTimeMs: number;
}

export interface AuditFinding {
  urlPath: string;
  issueType: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export function runTechnicalAuditOnPages(
  pages: PageContentSimulated[],
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const titles = new Set<string>();

  for (const page of pages) {
    // 1. Missing Title check
    if (!page.title || page.title.trim() === '') {
      findings.push({
        urlPath: page.urlPath,
        issueType: 'MISSING_TITLE',
        severity: 'CRITICAL',
        description: 'Page title tag is missing or completely empty.',
      });
    } else {
      // Duplicate title check
      if (titles.has(page.title)) {
        findings.push({
          urlPath: page.urlPath,
          issueType: 'DUPLICATE_TITLE',
          severity: 'HIGH',
          description: `Duplicate title tag detected: "${page.title}"`,
        });
      }
      titles.add(page.title);
    }

    // 2. Meta description check
    if (!page.metaDescription || page.metaDescription.trim() === '') {
      findings.push({
        urlPath: page.urlPath,
        issueType: 'MISSING_META_DESCRIPTION',
        severity: 'HIGH',
        description: 'Meta description tag is missing.',
      });
    }

    // 3. Headings checks
    const h1s = page.headings.filter((h) => h.startsWith('H1:'));
    if (h1s.length === 0) {
      findings.push({
        urlPath: page.urlPath,
        issueType: 'MISSING_H1',
        severity: 'HIGH',
        description: 'H1 heading tag is missing on the page.',
      });
    } else if (h1s.length > 1) {
      findings.push({
        urlPath: page.urlPath,
        issueType: 'DUPLICATE_H1',
        severity: 'MEDIUM',
        description: 'Multiple H1 tags found on the page.',
      });
    }

    // 4. Large images & missing alts checks
    for (const img of page.images) {
      if (!img.alt || img.alt.trim() === '') {
        findings.push({
          urlPath: page.urlPath,
          issueType: 'MISSING_ALT_TEXT',
          severity: 'MEDIUM',
          description: 'Image missing descriptive alt text attribute.',
        });
      }
      if (img.sizeBytes > 1024 * 1024) {
        findings.push({
          urlPath: page.urlPath,
          issueType: 'LARGE_IMAGE',
          severity: 'LOW',
          description: `Large image file size detected: ${Math.round(img.sizeBytes / 1024)} KB`,
        });
      }
    }

    // 5. Page speed check
    if (page.loadTimeMs > 2000) {
      findings.push({
        urlPath: page.urlPath,
        issueType: 'SLOW_PAGE_SPEED',
        severity: 'MEDIUM',
        description: `Slow response speed logged: ${page.loadTimeMs}ms`,
      });
    }
  }

  return findings;
}
