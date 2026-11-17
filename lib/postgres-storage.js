import {neon} from '@neondatabase/serverless';
import {randomUUID} from 'node:crypto';
// The document version is compared atomically in Postgres, preserving the
// existing stores' optimistic concurrency without whole-file Blob reads.
export function createPostgresStorage(sql){
 let initialized;
 const ready=()=>initialized??=(sql`CREATE TABLE IF NOT EXISTS archive_documents (pathname text PRIMARY KEY, body text NOT NULL, content_type text NOT NULL, etag text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`.catch(e=>{initialized=null;throw e}));
 async function get(path){await ready();const [r]=await sql`SELECT body,content_type,etag FROM archive_documents WHERE pathname=${path}`;if(!r)return null;return {statusCode:200,stream:new Blob([Buffer.from(r.body,'base64')]).stream(),blob:{etag:r.etag,contentType:r.content_type}}}
 async function head(path){await ready();const [r]=await sql`SELECT etag FROM archive_documents WHERE pathname=${path}`;return r||{etag:null}}
 async function put(path,body,options={}){
  await ready();const encoded=Buffer.from(body).toString('base64'),etag=randomUUID(),type=options.contentType||'application/octet-stream';let rows;
  if(options.ifMatch)rows=await sql`UPDATE archive_documents SET body=${encoded},content_type=${type},etag=${etag},updated_at=now() WHERE pathname=${path} AND etag=${options.ifMatch} RETURNING etag`;
  else rows=await sql`INSERT INTO archive_documents(pathname,body,content_type,etag) VALUES(${path},${encoded},${type},${etag}) ON CONFLICT(pathname) DO NOTHING RETURNING etag`;
  if(!rows.length){const e=Error('Document changed or already exists');e.name=options.ifMatch?'BlobPreconditionFailedError':'BlobAlreadyExistsError';throw e}return {pathname:path,etag};
 }
 async function list({prefix='',cursor,limit=1000}={}){await ready();const rows=await sql`SELECT pathname FROM archive_documents WHERE left(pathname,length(${prefix}))=${prefix} AND pathname>${cursor||''} ORDER BY pathname LIMIT ${limit+1}`;const hasMore=rows.length>limit;const blobs=rows.slice(0,limit);return {blobs,hasMore,cursor:hasMore?blobs.at(-1).pathname:undefined}}
 async function readJson(path){await ready();const [r]=await sql`SELECT body,etag FROM archive_documents WHERE pathname=${path}`;return r?{data:JSON.parse(Buffer.from(r.body,'base64').toString('utf8')),etag:r.etag}:{data:null,etag:null}}
 return {get,head,put,list,readJson};
}
let storage;
export function postgresStorage(){if(!process.env.DATABASE_URL)throw Error('Shared database is not configured');return storage??=createPostgresStorage(neon(process.env.DATABASE_URL))}
