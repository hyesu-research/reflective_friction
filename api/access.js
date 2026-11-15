import { activeEntry, getAccessSession, matchId, privateHeaders, sameOrigin, SESSION_TTL } from '../lib/archive-access.js';

// Per-instance throttling complements the randomly generated 96-bit access IDs.
const attempts = new Map();
function throttled(req) {
  const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0];
  const now = Date.now();
  if (attempts.size > 1000) for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  let record = attempts.get(ip);
  if (!record || record.until < now) record = { count: 0, until: now + 60000 };
  record.count++; attempts.set(ip, record);
  return record.count > 10;
}
export default async function handler(req, res) {
  privateHeaders(res);
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: '허용되지 않는 요청입니다.' }); }
  if (req.method === 'POST' && !sameOrigin(req)) return res.status(403).json({ error: '페이지를 새로 열고 다시 시도해주세요.' });
  try {
    const session = await getAccessSession(req, res);
    if (req.method === 'GET') {
      const entry = activeEntry(session);
      return res.json({ authenticated: Boolean(entry), label: entry?.label || null });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body?.action === 'logout') { session.destroy(); return res.json({ ok: true }); }
    if (throttled(req)) { res.setHeader('Retry-After', '60'); return res.status(429).json({ error: '잠시 후 다시 시도해주세요.' }); }
    const entry = matchId(body?.id);
    if (!entry) return res.status(401).json({ error: '아이디를 확인해주세요.' });
    session.digest = entry.digest;
    session.expiresAt = Date.now() + SESSION_TTL * 1000;
    await session.save();
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: '입장을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.' });
  }
}
