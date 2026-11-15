import * as blob from '@vercel/blob';
import {activeEntry,getAccessSession,privateHeaders,sameOrigin} from '../lib/archive-access.js';
import {createCasesStore,sanitizeCase,CaseConflict} from '../lib/cases-store.js';
const store=createCasesStore(blob);
export default async function handler(req,res){
 privateHeaders(res);
 if(!['GET','PUT'].includes(req.method)){res.setHeader('Allow','GET, PUT');return res.status(405).json({error:'허용되지 않는 요청입니다.'})}
 if(req.method==='PUT'&&!sameOrigin(req))return res.status(403).json({error:'페이지를 다시 열어주세요.'});
 try{
  if(!activeEntry(await getAccessSession(req,res)))return res.status(401).json({error:'다시 로그인해주세요.'});
  if(req.method==='GET')return res.json({records:(await store.read()).records});
  if(Number(req.headers['content-length'])>1500000)return res.status(413).json({error:'사례 내용이 너무 큽니다.'});
  let body,item;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;item=sanitizeCase(body?.item);if(!(body.revision===null||typeof body.revision==='string'&&/^[a-f0-9-]{36}$/.test(body.revision)))throw Error()}catch{return res.status(400).json({error:'사례명·유형과 입력 내용을 확인해주세요. 이미지는 업로드하거나 URL을 입력해주세요.'})}
  return res.json({record:await store.write(item,body.revision)});
 }catch(e){if(e instanceof CaseConflict)return res.status(409).json({error:'다른 연구자가 이 사례를 수정했습니다. 작성 내용은 유지됩니다.',current:e.current});console.error('Case storage failed',e.constructor?.name,e.message);return res.status(503).json({error:'공동 저장하지 못했습니다. 입력 내용은 유지됩니다. 다시 저장해주세요.'})}
}
