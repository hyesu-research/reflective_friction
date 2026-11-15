import {readBlobJson} from './blob-json.js';
import { randomUUID } from 'node:crypto';
export const NOTE_FIELDS = ['professorNote', 'note', 'youngchanNote', 'jungwooNote'];
export class NoteConflict extends Error { constructor(current) { super('Note conflict'); this.current = current; } }
export function createNotesStore(blob) {
  const path = id => `researcher-notes/v1/${id}.json`;
  async function read(id) {const {data,etag}=await readBlobJson(blob,path(id));return {notes:data?.notes||{},etag};}
  async function write(id, field, text, expectedRevision) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const current = await read(id);
      const record = current.notes[field] || null;
      if ((record?.revision || null) !== expectedRevision) throw new NoteConflict(record);
      const next = { text, revision: randomUUID(), updatedAt: new Date().toISOString() };
      try {
        await blob.put(path(id), JSON.stringify({ notes: { ...current.notes, [field]: next } }), {
          access: 'private', addRandomSuffix: false, contentType: 'application/json',
          allowOverwrite: Boolean(current.etag), ...(current.etag ? { ifMatch: current.etag } : {}),
        });
        return next;
      } catch (error) {
        const conflict = ['BlobPreconditionFailedError','BlobAlreadyExistsError'].some(name => name === error.constructor?.name || name === error.name) || [409,412].includes(error.statusCode) || (!current.etag && /already exists/i.test(error.message));
        if (!conflict) throw error;
      }
    }
    throw new NoteConflict((await read(id)).notes[field] || null);
  }
  return { read, write };
}
