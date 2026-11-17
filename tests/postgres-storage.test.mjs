import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPostgresStorage} from '../lib/postgres-storage.js';
import {readBlobJson} from '../lib/blob-json.js';
test('database snapshot returns data and revision from one query, without HEAD',async()=>{
 let calls=0;const sql=async(strings)=>{calls++;if(strings[0].startsWith('CREATE'))return [];return [{body:Buffer.from('{"likes":{"E09":["김혜수"]}}').toString('base64'),etag:'revision-a'}]};
 const store=createPostgresStorage(sql);const result=await readBlobJson(store,'researcher-hearts/v1/hearts.json');
 assert.deepEqual(result,{data:{likes:{E09:['김혜수']}},etag:'revision-a'});assert.equal(calls,2);
});
test('stale database write is rejected rather than overwriting current contents',async()=>{
 const queries=[];const sql=async(strings,...args)=>{queries.push({sql:strings.join('?'),args});return []};const store=createPostgresStorage(sql);
 await assert.rejects(store.put('notes.json','{}',{ifMatch:'stale',allowOverwrite:true}),{name:'BlobPreconditionFailedError'});
 assert.match(queries.at(-1).sql,/WHERE pathname=\? AND etag=\?/);assert.equal(queries.at(-1).args.at(-1),'stale');
});
test('existing document cannot be recreated or silently replaced',async()=>{
 const sql=async()=>[];await assert.rejects(createPostgresStorage(sql).put('hearts.json','{}'),{name:'BlobAlreadyExistsError'});
});
test('uploaded binary images survive database read without UTF-8 conversion',async()=>{
 const original=Buffer.from([0,255,137,80,78,71]);const sql=async(strings)=>strings[0].startsWith('CREATE')?[]:[{body:original.toString('base64'),content_type:'image/png',etag:'image-v1'}];
 const r=await createPostgresStorage(sql).get('case-media/v1/image.png');assert.deepEqual(Buffer.from(await new Response(r.stream).arrayBuffer()),original);assert.equal(r.blob.contentType,'image/png');
});
