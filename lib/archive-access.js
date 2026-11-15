import { createHash, timingSafeEqual } from 'node:crypto';
import { getIronSession } from 'iron-session';

export const SESSION_TTL = 60 * 60 * 24 * 7;
export function accessEntries() {
  const entries = JSON.parse(process.env.ARCHIVE_ACCESS_IDS || '[]');
  if (!Array.isArray(entries)) throw new Error('Invalid access configuration');
  return entries.filter(x => typeof x.label === 'string' && /^[a-f0-9]{64}$/.test(x.digest));
}
export function digestId(value) {
  return createHash('sha256').update(value.trim().toUpperCase().replace(/[-\s]/g, '')).digest('hex');
}
export function matchId(value) {
  if (typeof value !== 'string' || value.length > 128 || value.length < 10) return null;
  const digest = Buffer.from(digestId(value), 'hex');
  return accessEntries().find(x => timingSafeEqual(Buffer.from(x.digest, 'hex'), digest)) || null;
}
export async function getAccessSession(req, res) {
  if (!process.env.ARCHIVE_SESSION_SECRET || process.env.ARCHIVE_SESSION_SECRET.length < 32) throw new Error('Access is not configured');
  return getIronSession(req, res, {
    cookieName: process.env.NODE_ENV === 'production' ? '__Host-deeplab_archive' : 'deeplab_archive',
    password: process.env.ARCHIVE_SESSION_SECRET,
    ttl: SESSION_TTL,
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
  });
}
export function activeEntry(session) {
  if (!session.digest || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return null;
  return accessEntries().find(x => x.digest === session.digest) || null;
}
export function privateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}
export function sameOrigin(req) {
  try { return new URL(req.headers.origin).host === req.headers.host; } catch { return false; }
}
