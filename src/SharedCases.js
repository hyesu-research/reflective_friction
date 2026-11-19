import {isSyncActive} from './sync-activity';
import {useState,useEffect,useRef,useCallback} from 'react';
async function responseData(response){let data;try{data=await response.json()}catch{throw Error('서버 응답을 확인하지 못했습니다. 다시 저장해주세요.')}if(!response.ok){const e=Error(data.error||'공동 저장하지 못했습니다.');e.current=data.current;e.status=response.status;throw e}return data}
export async function uploadCaseMedia(item){
 const cache=new Map();async function upload(src){if(typeof src!=='string'||!src.startsWith('data:'))return src;if(cache.has(src))return cache.get(src);const data=await responseData(await fetch('/api/media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:src})}));cache.set(src,data.url);return data.url}
 const next={...item,image:await upload(item.image||'')};
 next.gallery=[];for(const image of item.gallery||[])next.gallery.push({...image,src:await upload(image.src)});
 return next;
}
export default function useSharedCases({setItems,localItems,seedIds}){
 const [ready,setReady]=useState(false),[error,setError]=useState('');
 const records=useRef({}),local=useRef(localItems),seeds=useRef(new Set(seedIds)),generation=useRef(0),writes=useRef(new Set()),signature=useRef('');
 const apply=useCallback(next=>{records.current={...records.current,...next};setItems(xs=>{const found=new Set(xs.map(x=>x.id));return [...xs.map(x=>next[x.id]?{...x,...next[x.id].item,_addedAt:next[x.id].createdAt||next[x.id].updatedAt}:x),...Object.values(next).filter(r=>!found.has(r.item.id)).map(r=>({...r.item,_addedAt:r.createdAt||r.updatedAt}))]})},[setItems]);
 const saveCase=useCallback(async(item,revision)=>{
  if(writes.current.has(item.id))throw Error('이 사례를 저장 중입니다. 잠시 기다려주세요.');
  writes.current.add(item.id);generation.current++;
  try{const clean=await uploadCaseMedia(item);const data=await responseData(await fetch('/api/cases',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({item:clean,revision})}));generation.current++;apply({[item.id]:data.record});return data.record.item}
  finally{writes.current.delete(item.id)}
 },[apply]);
 useEffect(()=>{let stopped=false,loading=false,migrated=false;async function load(){if(loading||document.hidden||!isSyncActive())return;loading=true;const v=generation.current;try{const data=await responseData(await fetch('/api/cases',{cache:'no-store'}));if(stopped||v!==generation.current||writes.current.size)return;const sig=JSON.stringify(Object.entries(data.records).map(([id,r])=>[id,r.revision]));if(sig!==signature.current){signature.current=sig;apply(data.records)}setReady(true);setError('');if(!migrated){migrated=true;for(const item of local.current.filter(x=>!seeds.current.has(x.id)&&!data.records[x.id])){try{await saveCase(item,null)}catch(e){if(e.status===409&&e.current)apply({[item.id]:e.current});else if(!stopped)setError('기존 로컬 사례를 공유하지 못했습니다. 해당 사례를 열어 수정 후 다시 저장해주세요.')}}}}catch(e){if(!stopped)setError(e.message||'공동 사례를 불러오지 못했습니다.')}finally{loading=false}}load();const timer=setInterval(load,120000);window.addEventListener('focus',load);document.addEventListener('visibilitychange',load);return()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',load);document.removeEventListener('visibilitychange',load)}},[apply,saveCase]);
 return {ready,error,saveCase,revision:id=>records.current[id]?.revision||null};
}
