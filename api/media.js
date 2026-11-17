import {createHash} from 'node:crypto';
import {get,put} from '../lib/storage.js';
import {activeEntry,getAccessSession,privateHeaders,sameOrigin} from '../lib/archive-access.js';
export default async function handler(req,res){
 privateHeaders(res);
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).end()}
 if(req.method==='POST'&&!sameOrigin(req))return res.status(403).json({error:'페이지를 다시 열어주세요.'});
 try{
  if(!activeEntry(await getAccessSession(req,res)))return res.status(401).json({error:'다시 로그인해주세요.'});
  if(req.method==='GET'){
   const id=req.query?.id;if(typeof id!=='string'||!/^[a-f0-9]{64}\.(png|jpg|webp|gif|avif)$/.test(id))return res.status(400).end();
   const r=await get(`case-media/v1/${id}`,{access:'private'});if(!r||r.statusCode!==200)return res.status(404).end();
   res.setHeader('Content-Type',r.blob.contentType||'application/octet-stream');return res.send(Buffer.from(await new Response(r.stream).arrayBuffer()));
  }
  if(Number(req.headers['content-length'])>2200000)return res.status(413).json({error:'이미지는 한 장당 1.5MB 이하로 올려주세요.'});
  let data;try{const b=typeof req.body==='string'?JSON.parse(req.body):req.body;data=b?.data}catch{}
  const m=typeof data==='string'&&data.match(/^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,([A-Za-z0-9+/=\r\n]+)$/);if(!m)return res.status(400).json({error:'PNG·JPEG·WebP·GIF·AVIF 이미지를 사용해주세요.'});
  const bytes=Buffer.from(m[2],'base64');if(!bytes.length||bytes.length>1500000)return res.status(413).json({error:'이미지는 한 장당 1.5MB 이하로 올려주세요.'});
  const ext=m[1]==='jpeg'?'jpg':m[1],id=createHash('sha256').update(bytes).digest('hex')+'.'+ext;
  try{await put(`case-media/v1/${id}`,bytes,{access:'private',addRandomSuffix:false,contentType:`image/${ext==='jpg'?'jpeg':ext}`})}catch(e){if(!/already exists/i.test(e.message))throw e}
  return res.json({url:`/api/media?id=${id}`});
 }catch{ return res.status(503).json({error:'이미지를 저장하지 못했습니다. 다시 시도해주세요.'}) }
}
