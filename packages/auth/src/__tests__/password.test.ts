import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password.js';
import { generateApiKey, hashApiKey, parseApiKeyPrefix } from '../apikey.js';
import { generateSessionToken, hashToken } from '../session.js';

describe('Password hashing', () => {
  it('hashes a password and verifies it successfully', async () => {
    const password = 'supersecure-password-123';
    const hash = await hashPassword(password);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    const valid = await verifyPassword(hash, password);
    expect(valid).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('correct-password-123');
    const valid = await verifyPassword(hash, 'wrong-password-456');
    expect(valid).toBe(false);
  });

  it('produces different hashes for the same password', async () => {
    const hash1 = await hashPassword('same-password-123');
    const hash2 = await hashPassword('same-password-123');
    expect(hash1).not.toBe(hash2);
  });
});

describe('API key generation', () => {
  it('generates a valid API key', () => {
    const { fullKey, keyPrefix, keyHash } = generateApiKey();
    expect(fullKey).toMatch(/^ucedge_[a-f0-9]+_/);
    expect(keyPrefix).toHaveLength(8);
    expect(keyHash).toHaveLength(64);
  });

  it('parses the prefix from a key', () => {
    const { fullKey, keyPrefix } = generateApiKey();
    const parsed = parseApiKeyPrefix(fullKey);
    expect(parsed).toBe(keyPrefix);
  });

  it('returns null for invalid key format', () => {
    expect(parseApiKeyPrefix('invalid-key')).toBeNull();
    expect(parseApiKeyPrefix('other_prefix_secret')).toBeNull();
  });

  it('hashes the key consistently', () => {
    const { fullKey } = generateApiKey();
    const h1 = hashApiKey(fullKey);
    const h2 = hashApiKey(fullKey);
    expect(h1).toBe(h2);
  });
});

describe('Session token generation', () => {
  it('generates a valid session token', () => {
    const { token, tokenHash, expiresAt } = generateSessionToken();
    expect(token.length).toBeGreaterThan(30);
    expect(tokenHash).toHaveLength(64);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('hashing the token is deterministic', () => {
    const { token, tokenHash } = generateSessionToken();
    expect(hashToken(token)).toBe(tokenHash);
  });
});
