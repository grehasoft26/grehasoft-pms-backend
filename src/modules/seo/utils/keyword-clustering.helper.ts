export interface KeywordClusteringResult {
  groupName: string;
  terms: string[];
}

export function clusterKeywords(terms: string[]): KeywordClusteringResult[] {
  const clusters: Record<string, string[]> = {
    'Brand & Core': [],
    'Services & Solutions': [],
    'Information & Support': [],
    'Local & Regional': [],
    'General Queries': [],
  };

  for (const term of terms) {
    const lower = term.toLowerCase();
    if (lower.includes('grehasoft') || lower.includes('brand')) {
      clusters['Brand & Core'].push(term);
    } else if (lower.includes('service') || lower.includes('software') || lower.includes('pms') || lower.includes('tool')) {
      clusters['Services & Solutions'].push(term);
    } else if (lower.includes('how') || lower.includes('what') || lower.includes('guide') || lower.includes('tips')) {
      clusters['Information & Support'].push(term);
    } else if (lower.includes('near') || lower.includes('india') || lower.includes('bangalore') || lower.includes('local')) {
      clusters['Local & Regional'].push(term);
    } else {
      clusters['General Queries'].push(term);
    }
  }

  // Filter out empty clusters and map to array
  return Object.entries(clusters)
    .filter(([_, t]) => t.length > 0)
    .map(([groupName, t]) => ({
      groupName,
      terms: t,
    }));
}
