import * as crypto from 'crypto';

export function generateRawApiKey(prefix = 'gsp'): { rawKey: string; prefix: string; keyHash: string } {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const rawKey = `${prefix}_${randomBytes}`;
  const keyHash = hashApiKey(rawKey);

  return {
    rawKey,
    prefix,
    keyHash,
  };
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}
