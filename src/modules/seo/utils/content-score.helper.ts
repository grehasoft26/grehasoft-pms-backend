export interface ContentStats {
  wordCount: number;
  keywordCount: number;
  hasH1: boolean;
  duplicateH1: boolean;
  altTagsMissing: number;
}

export function calculateContentQualityScore(stats: ContentStats): number {
  let score = 100;

  // Word count check (thin content deduction)
  if (stats.wordCount < 300) {
    score -= 30; // thin content
  } else if (stats.wordCount < 600) {
    score -= 15;
  }

  // Keyword density check
  if (stats.wordCount > 0) {
    const density = (stats.keywordCount / stats.wordCount) * 100;
    if (density > 5.5) {
      score -= 20; // Keyword stuffing
    } else if (density < 0.5) {
      score -= 10; // Low keyword optimization
    }
  }

  // Heading structure check
  if (!stats.hasH1) {
    score -= 20;
  } else if (stats.duplicateH1) {
    score -= 10;
  }

  // Alt text missing
  if (stats.altTagsMissing > 0) {
    score -= Math.min(15, stats.altTagsMissing * 3);
  }

  return Math.max(0, score);
}
