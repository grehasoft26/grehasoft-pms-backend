import * as crypto from 'crypto';

export function generateWebhookSignature(
  secretToken: string,
  payloadJson: string,
  timestamp: number,
): string {
  const data = `${timestamp}.${payloadJson}`;
  return crypto.createHmac('sha256', secretToken).update(data).digest('hex');
}

export function verifyWebhookSignature(
  secretToken: string,
  payloadJson: string,
  signature: string,
  timestamp: number,
  toleranceSeconds = 300,
): boolean {
  // Replay Protection: check if timestamp is within tolerance (e.g. 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > toleranceSeconds) {
    return false;
  }

  const expectedSignature = generateWebhookSignature(
    secretToken,
    payloadJson,
    timestamp,
  );
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}
