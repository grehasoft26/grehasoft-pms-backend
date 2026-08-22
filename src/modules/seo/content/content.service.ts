import { Injectable } from '@nestjs/common';
import { calculateContentQualityScore } from '../utils/content-score.helper';

@Injectable()
export class ContentService {
  async evaluateContentQuality(
    text: string,
    keyword: string,
    options: { hasH1: boolean; duplicateH1: boolean; altTagsMissing: number },
  ) {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;

    // keyword matches count
    const keywordMatches =
      text.toLowerCase().split(keyword.toLowerCase()).length - 1;

    const stats = {
      wordCount,
      keywordCount: keywordMatches,
      hasH1: options.hasH1,
      duplicateH1: options.duplicateH1,
      altTagsMissing: options.altTagsMissing,
    };

    const score = calculateContentQualityScore(stats);
    const density = wordCount > 0 ? (keywordMatches / wordCount) * 100 : 0;

    return {
      wordCount,
      keywordCount: keywordMatches,
      keywordDensity: Math.round(density * 100) / 100,
      contentQualityScore: score,
    };
  }
}
