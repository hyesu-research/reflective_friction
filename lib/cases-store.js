import {readBlobJson} from './blob-json.js';
import {randomUUID} from 'node:crypto';
const path='shared-cases/v1/cases.json';
export class CaseConflict extends Error{constructor(current){super('Case conflict');this.current=current}}
export function createCasesStore(blob){
 async function read(){const {data,etag}=await readBlobJson(blob,path);return {records:data?.records||{},etag}}
 async function write(item,revision){
  for(let n=0;n<8;n++){
   const current=await read(),record=Object.hasOwn(current.records,item.id)?current.records[item.id]:null;
   if((record?.revision||null)!==revision)throw new CaseConflict(record);
   const now=new Date().toISOString();
   const next={item,revision:randomUUID(),createdAt:record?.createdAt||record?.updatedAt||now,updatedAt:now};
   try{await blob.put(path,JSON.stringify({records:{...current.records,[item.id]:next}}),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:Boolean(current.etag),...(current.etag?{ifMatch:current.etag}:{})});return next}
   catch(e){if(!(['BlobPreconditionFailedError','BlobAlreadyExistsError'].some(x=>x===e.name||x===e.constructor?.name)||[409,412].includes(e.statusCode)||(!current.etag&&/already exists/i.test(e.message))))throw e}
  }
  throw new CaseConflict((await read()).records[item.id]||null);
 }
 return {read,write};
}
export {sanitizeCase} from './case-validation.js';
