import {readBlobJson} from './blob-json.js';
export const RESEARCHERS = ['윤재영','김혜수','박영찬','배정우'];
const pathname='researcher-hearts/v1/hearts.json';
export function createHeartsStore(blob){
 async function read(){const {data,etag}=await readBlobJson(blob,pathname);return {likes:data?.likes||{},etag}}
 async function set(caseId,researcher,liked){
  for(let attempt=0;attempt<8;attempt++){
   const current=await read();const members=Array.isArray(current.likes[caseId])?current.likes[caseId]:[];
   if(members.includes(researcher)===liked)return current.likes;
   const next=RESEARCHERS.filter(name=>name===researcher?liked:members.includes(name));
   const likes={...current.likes};if(next.length)likes[caseId]=next;else delete likes[caseId];
   try{await blob.put(pathname,JSON.stringify({likes}),{access:'private',addRandomSuffix:false,contentType:'application/json',allowOverwrite:Boolean(current.etag),...(current.etag?{ifMatch:current.etag}:{})});return likes}
   catch(error){const conflict=['BlobPreconditionFailedError','BlobAlreadyExistsError'].some(n=>n===error.constructor?.name||n===error.name)||[409,412].includes(error.statusCode)||(!current.etag&&/already exists/i.test(error.message));if(!conflict)throw error}
  }
  throw Error('Concurrent write limit');
 }
 return {read,set};
}
