export function calculateSeoHealthScore(
  issues: { severity: string; isResolved: boolean }[],
): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.isResolved) continue;

    switch (issue.severity) {
      case 'CRITICAL':
        score -= 20;
        break;
      case 'HIGH':
        score -= 10;
        break;
      case 'MEDIUM':
        score -= 5;
        break;
      case 'LOW':
        score -= 2;
        break;
      default:
        score -= 1;
        break;
    }
  }

  return Math.max(0, score);
}
