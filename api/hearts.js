import * as blob from '../lib/storage.js';
import {activeEntry,getAccessSession,privateHeaders,sameOrigin} from '../lib/archive-access.js';
import {createHeartsStore,RESEARCHERS} from '../lib/hearts-store.js';
const store=createHeartsStore(blob);
export default async function handler(req,res){
 privateHeaders(res);
 if(!['GET','PUT'].includes(req.method)){res.setHeader('Allow','GET, PUT');return res.status(405).json({error:'허용되지 않는 요청입니다.'})}
 if(req.method==='PUT'&&!sameOrigin(req))return res.status(403).json({error:'페이지를 다시 열어주세요.'});
 try{
  if(!activeEntry(await getAccessSession(req,res)))return res.status(401).json({error:'다시 로그인해주세요.'});
  if(req.method==='GET')return res.json({likes:(await store.read()).likes});
  if(Number(req.headers['content-length'])>2000)return res.status(413).json({error:'요청이 너무 큽니다.'});
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return res.status(400).json({error:'올바른 요청이 아닙니다.'})}
  if(!body||typeof body.caseId!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(body.caseId)||!RESEARCHERS.includes(body.researcher)||typeof body.liked!=='boolean')return res.status(400).json({error:'사례와 연구자 이름을 확인해주세요.'});
  return res.json({likes:await store.set(body.caseId,body.researcher,body.liked)});
 }catch(error){console.error('Hearts storage failed',error.constructor?.name,error.message);return res.status(503).json({error:'하트를 저장하지 못했습니다. 다시 눌러주세요.'})}
}
