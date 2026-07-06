import { createHash, randomBytes } from 'node:crypto';

const KEY_PREFIX_LENGTH = 8;
const KEY_SECRET_BYTES = 32;

export interface GeneratedApiKey {
  fullKey: string;
  keyPrefix: string;
  keyHash: string;
}

/**
 * Generates a new API key.
 * The full key is shown only once at creation time.
 * Only the hash is stored in the database.
 *
 * Format: ucedge_<prefix>_<secret>
 */
export function generateApiKey(): GeneratedApiKey {
  const prefix = randomBytes(KEY_PREFIX_LENGTH / 2).toString('hex');
  const secret = randomBytes(KEY_SECRET_BYTES).toString('base64url');
  const fullKey = `ucedge_${prefix}_${secret}`;
  const keyHash = hashApiKey(fullKey);
  return { fullKey, keyPrefix: prefix, keyHash };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Parses the prefix from an API key for fast database lookup.
 * Format: ucedge_<prefix>_<secret>
 */
export function parseApiKeyPrefix(key: string): string | null {
  const parts = key.split('_');
  if (parts.length < 3 || parts[0] !== 'ucedge') return null;
  return parts[1] ?? null;
}
