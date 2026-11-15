import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { activeEntry, getAccessSession, privateHeaders } from '../lib/archive-access.js';
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.zip':'application/zip' };
export default async function handler(req, res) {
  privateHeaders(res);
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
  try {
    const session = await getAccessSession(req, res);
    if (!activeEntry(session)) {
      if ((req.headers.accept || '').includes('text/html')) {
        res.setHeader('Location', '/login'); return res.status(303).end();
      }
      return res.status(401).end('Unauthorized');
    }
    const file = req.query?.file || 'index.html';
    if (typeof file !== 'string' || file.includes('\\') || file.includes('\0') || file.split('/').some(x => x === '..' || x === '.')) return res.status(400).end();
    const root = path.resolve(process.cwd(), 'dist');
    const target = path.resolve(root, file);
    if (!target.startsWith(root + path.sep)) return res.status(400).end();
    const bytes = await readFile(target);
    res.setHeader('Content-Type', types[path.extname(target).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Content-Length', bytes.length);
    return req.method === 'HEAD' ? res.status(200).end() : res.status(200).send(bytes);
  } catch (error) {
    return res.status(error?.code === 'ENOENT' ? 404 : 503).end();
  }
}
