import * as blob from '@vercel/blob';
import { activeEntry, getAccessSession, privateHeaders, sameOrigin } from '../lib/archive-access.js';
import { createNotesStore, NOTE_FIELDS, NoteConflict } from '../lib/notes-store.js';
const store = createNotesStore(blob);
export default async function handler(req, res) {
  privateHeaders(res);
  if (!['GET','PUT'].includes(req.method)) { res.setHeader('Allow','GET, PUT'); return res.status(405).json({error:'허용되지 않는 요청입니다.'}); }
  if (req.method === 'PUT' && !sameOrigin(req)) return res.status(403).json({error:'페이지를 다시 열어주세요.'});
  try {
    const session = await getAccessSession(req, res);
    if (!activeEntry(session)) return res.status(401).json({error:'다시 로그인해주세요.'});
    const id = req.query?.caseId;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) return res.status(400).json({error:'사례 ID를 확인해주세요.'});
    if (req.method === 'GET') return res.json({ notes: (await store.read(id)).notes });
    if (Number(req.headers['content-length']) > 100000) return res.status(413).json({error:'노트가 너무 깁니다.'});
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { return res.status(400).json({error:'올바른 요청이 아닙니다.'}); }
    if (!body || !NOTE_FIELDS.includes(body.field) || typeof body.text !== 'string' || body.text.length > 20000 || !(body.revision === null || typeof body.revision === 'string' && /^[a-f0-9-]{36}$/.test(body.revision))) return res.status(400).json({error:'노트는 20,000자까지 저장할 수 있습니다.'});
    const record = await store.write(id, body.field, body.text, body.revision);
    return res.json({ record });
  } catch (error) {
    if (error instanceof NoteConflict) return res.status(409).json({error:'다른 창에서 이 노트가 변경됐습니다.',current:error.current});
    return res.status(503).json({error:'서버에 저장하지 못했습니다. 작성 내용은 이 브라우저에 보관됩니다.'});
  }
}
