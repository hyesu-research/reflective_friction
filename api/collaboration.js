import * as blob from '@vercel/blob';
import {activeEntry,getAccessSession,privateHeaders} from '../lib/archive-access.js';
import {createCasesStore} from '../lib/cases-store.js';
import {createHeartsStore} from '../lib/hearts-store.js';
import {createNotesStore} from '../lib/notes-store.js';
export default async function handler(req,res){
 privateHeaders(res);
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end()}
 try{
  if(!activeEntry(await getAccessSession(req,res)))return res.status(401).json({error:'다시 로그인해주세요.'});
  const includeNotes=req.query?.notes==='1',includeHearts=req.query?.hearts!=='0';
  const [cases,hearts]=await Promise.all([createCasesStore(blob).read(),includeHearts?createHeartsStore(blob).read():Promise.resolve({likes:{}})]);
  let notes;
  if(includeNotes){notes={};const ids=[];let cursor;do{const page=await blob.list({prefix:'researcher-notes/v1/',limit:1000,...cursor?{cursor}:{}});for(const b of page.blobs){const m=b.pathname.match(/^researcher-notes\/v1\/([A-Za-z0-9_-]{1,80})\.json$/);if(m)ids.push(m[1])}cursor=page.hasMore?page.cursor:undefined}while(cursor);
   let index=0;const store=createNotesStore(blob);await Promise.all(Array.from({length:Math.min(4,ids.length)},async()=>{while(index<ids.length){const id=ids[index++];notes[id]=(await store.read(id)).notes}}));
  }
  return res.json({records:cases.records,likes:hearts.likes,...includeNotes?{notes}:{},fetchedAt:new Date().toISOString()});
 }catch(e){console.error('Collaboration export failed',e.constructor?.name,e.message);return res.status(503).json({error:'공동 저장 자료를 불러오지 못했습니다. 다시 시도해주세요.'})}
}
