import React,{useState,useRef,useEffect,useCallback} from 'react';
import ResearcherName,{ResearcherNames} from './ResearcherName';
export const RESEARCHERS=['윤재영','김혜수','박영찬','배정우'];
const identityKey='reflective-researcher-name';
export function useHearts(){
 const [likes,setLikes]=useState({}),[researcher,setResearcher]=useState(()=>{try{const name=localStorage.getItem(identityKey);return RESEARCHERS.includes(name)?name:''}catch{return ''}});
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[choosing,setChoosing]=useState(false),[busy,setBusy]=useState({});
 const pending=useRef(null),writes=useRef(new Set()),version=useRef(0),writeFailed=useRef(false),likesRef=useRef(likes);likesRef.current=likes;
 useEffect(()=>{let stopped=false,reading=false;async function load(){if(reading||document.hidden)return;reading=true;const v=version.current;try{const r=await fetch('/api/hearts',{cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error);if(!stopped&&v===version.current&&writes.current.size===0){setLikes(data.likes);setReady(true);if(!writeFailed.current)setError('')}}catch(e){if(!stopped)setError(e.message||'하트를 불러오지 못했습니다.')}finally{reading=false}}load();const timer=setInterval(load,5000);window.addEventListener('focus',load);document.addEventListener('visibilitychange',load);return()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',load);document.removeEventListener('visibilitychange',load)}},[]);
 const write=useCallback(async(caseId,name)=>{
  if(writes.current.has(caseId))return;
  const liked=!(likesRef.current[caseId]||[]).includes(name);writes.current.add(caseId);version.current++;setBusy(s=>({...s,[caseId]:true}));writeFailed.current=false;setError('');
  try{const r=await fetch('/api/hearts',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId,researcher:name,liked})});const data=await r.json();if(!r.ok)throw Error(data.error);
   // Only replace the touched case; another in-flight response may contain an older snapshot.
   setLikes(s=>({...s,[caseId]:data.likes[caseId]||[]}));version.current++;
  }catch(e){writeFailed.current=true;setError(e.message||'하트를 저장하지 못했습니다. 다시 눌러주세요.')}
  finally{writes.current.delete(caseId);setBusy(s=>({...s,[caseId]:false}))}
 },[]);
 function toggle(caseId){if(!ready)return;if(!researcher){pending.current=caseId;setChoosing(true)}else write(caseId,researcher)}
 function choose(name){setResearcher(name);try{localStorage.setItem(identityKey,name)}catch{}setChoosing(false);if(pending.current){const id=pending.current;pending.current=null;write(id,name)}}
 function changeResearcher(){pending.current=null;setChoosing(true)}
 function close(){pending.current=null;setChoosing(false)}
 return {likes,researcher,ready,error,choosing,busy,toggle,choose,changeResearcher,close};
}
export function ResearcherPicker({open,onChoose,onClose}){
 const dialog=useRef(null);
 useEffect(()=>{const el=dialog.current;if(open&&!el.open)el.showModal();if(!open&&el.open)el.close()},[open]);
 return <dialog ref={dialog} className="researcher-picker" aria-labelledby="researcher-picker-title" onCancel={onClose} onClose={onClose} onClick={e=>{if(e.target===dialog.current)onClose()}}><h2 id="researcher-picker-title">이름을 선택해주세요</h2><p>하트를 남길 연구자 이름을 선택해주세요.</p><div>{RESEARCHERS.map(name=><button key={name} onClick={()=>onChoose(name)}><ResearcherName name={name}/></button>)}</div><button className="picker-close" onClick={onClose}>닫기</button></dialog>
}
export function HeartButton({id,title,hearts}){
 const names=hearts.likes[id]||[],active=names.includes(hearts.researcher);
 return <div className="card-hearts"><button className="heart-toggle" aria-label={`${title} 하트`} aria-pressed={active} title={active?'하트 취소':'하트 남기기'} disabled={!hearts.ready||hearts.busy[id]} onClick={()=>hearts.toggle(id)}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="1.5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button><details className="heart-members"><summary aria-label={`${title} 하트한 연구자 ${names.length}명`} title={names.length?names.join(', '):'아직 하트가 없습니다.'}>{hearts.ready?names.length:'–'}</summary><div><span>{names.length?<ResearcherNames names={names}/>:'아직 하트가 없습니다.'}</span><button className="heart-change-name" onClick={hearts.changeResearcher}>{hearts.researcher?`${hearts.researcher} · 이름 변경`:'이름 선택'}</button></div></details></div>
}
