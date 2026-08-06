const clientRequestLogs = new Map<string, number[]>();

export function checkSlidingWindowRateLimit(
  identifier: string,
  limitCount: number,
  windowSeconds: number
): { isAllowed: boolean; remainingRequests: number; resetTimeSeconds: number } {
  const currentTimeMs = Date.now();
  const currentTimeSecs = Math.floor(currentTimeMs / 1000);
  const windowMs = windowSeconds * 1000;

  let requestTimestamps = clientRequestLogs.get(identifier) || [];

  // Filter out timestamps older than current window
  requestTimestamps = requestTimestamps.filter((t) => currentTimeMs - t < windowMs);

  if (requestTimestamps.length >= limitCount) {
    const oldestTimestamp = requestTimestamps[0];
    const resetTimeSecs = Math.ceil((oldestTimestamp + windowMs) / 1000);
    return {
      isAllowed: false,
      remainingRequests: 0,
      resetTimeSeconds: Math.max(0, resetTimeSecs - currentTimeSecs),
    };
  }

  requestTimestamps.push(currentTimeMs);
  clientRequestLogs.set(identifier, requestTimestamps);

  const oldestTimestamp = requestTimestamps[0];
  const resetTimeSecs = Math.ceil((oldestTimestamp + windowMs) / 1000);

  return {
    isAllowed: true,
    remainingRequests: limitCount - requestTimestamps.length,
    resetTimeSeconds: Math.max(0, resetTimeSecs - currentTimeSecs),
  };
}
