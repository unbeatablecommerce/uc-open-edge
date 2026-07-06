import { createHash, randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';

const SESSION_TOKEN_BYTES = 48;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 * 7; // 7 days

export interface SessionToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function generateSessionToken(): SessionToken {
  const token = randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  return { token, tokenHash, expiresAt };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const COOKIE_NAME = 'ucedge_session';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env['NODE_ENV'] === 'production',
} as const;
