// Run only with server-side credentials after the legacy Blob store resumes.
// Conflicts are retained for manual reconciliation, never overwritten.
import * as blob from '@vercel/blob';
import {postgresStorage} from '../lib/postgres-storage.js';
import {mkdir,writeFile} from 'node:fs/promises';
const db=postgresStorage();await mkdir('.private/legacy-backup',{recursive:true});
let cursor,imported=0,conflicts=0;
do{const page=await blob.list({limit:1000,...cursor?{cursor}:{}});for(const item of page.blobs){
 if(!/^(researcher-hearts|researcher-notes|shared-cases|case-media)\/v1\//.test(item.pathname))continue;
 const response=await blob.get(item.pathname,{access:'private',useCache:false});if(response?.statusCode!==200)throw Error('Legacy storage is still unavailable; migration stopped');
 const bytes=Buffer.from(await new Response(response.stream).arrayBuffer());
 const filename=Buffer.from(item.pathname).toString('base64url');await writeFile('.private/legacy-backup/'+filename,bytes,{mode:0o600});
 try{await db.put(item.pathname,bytes,{contentType:response.blob.contentType});imported++}catch(e){if(e.name!=='BlobAlreadyExistsError')throw e;conflicts++}
 }cursor=page.hasMore?page.cursor:undefined;
}while(cursor);
console.log(JSON.stringify({imported,conflicts,backup:'.private/legacy-backup',next:'Review conflicts against the backup before merging. Existing database records were not overwritten.'}));
