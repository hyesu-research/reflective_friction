import {isSyncActive} from './sync-activity';
import React,{useState,useEffect,useRef,useCallback} from 'react';
import ResearcherName from './ResearcherName';
const FIELDS=[['professorNote','윤재영'],['note','김혜수'],['youngchanNote','박영찬'],['jungwooNote','배정우']];
const draftKey=(id,field)=>`reflective-note-draft:${id}:${field}`;
function readDraft(id,field){try{return JSON.parse(sessionStorage.getItem(draftKey(id,field)))}catch{return null}}
function NoteField({id,field,name,seed,color,record,ready,loadError,onSaved}){
 const recovered=useRef(readDraft(id,field));
 const [text,setText]=useState(recovered.current?.text??seed??'');
 const [dirty,setDirty]=useState(Boolean(recovered.current));
 const [status,setStatus]=useState(''),[conflict,setConflict]=useState(null);
 const revision=useRef(recovered.current?.revision??null),inFlight=useRef(false),latest=useRef(text),dirtyRef=useRef(dirty),saveRef=useRef(null),readyRef=useRef(false);
 latest.current=text;dirtyRef.current=dirty;readyRef.current=ready;
 useEffect(()=>{
  if(!ready)return;
  if(!dirtyRef.current){revision.current=record?.revision||null;setText(record?.text??seed??'');setStatus(record?'저장됨':'');}
 },[ready,record?.revision,seed]);
 const remember=useCallback((value)=>{try{sessionStorage.setItem(draftKey(id,field),JSON.stringify({text:value,revision:revision.current}))}catch{}},[id,field]);
 const save=useCallback(async()=>{
  if(!readyRef.current||inFlight.current||!dirtyRef.current)return;
  inFlight.current=true;const sent=latest.current;setStatus('저장 중…');
  try{
   const response=await fetch(`/api/notes?caseId=${encodeURIComponent(id)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({field,text:sent,revision:revision.current}),keepalive:true});
   const data=await response.json();
   if(response.status===409){setConflict({record:data.current});setStatus('동시 수정 확인 필요');return;}
   if(!response.ok)throw Error(data.error||'저장하지 못했습니다.');
   revision.current=data.record.revision;onSaved(field,data.record);
   if(latest.current===sent){dirtyRef.current=false;setDirty(false);setStatus('저장됨');try{sessionStorage.removeItem(draftKey(id,field))}catch{}}
   else {remember(latest.current);setStatus('저장 대기');}
  }catch(error){setStatus(error.message||'저장하지 못했습니다. 다시 시도해주세요.');}
  finally{inFlight.current=false;}
 },[id,field,onSaved,remember]);
 saveRef.current=save;
 useEffect(()=>{if(!dirty||!ready||conflict)return;const timer=setTimeout(()=>saveRef.current(),800);return()=>clearTimeout(timer)},[text,dirty,ready,conflict,status==='저장 대기']);
 useEffect(()=>()=>{if(dirtyRef.current)saveRef.current?.()},[]);
 useEffect(()=>{function warn(e){if(dirtyRef.current){e.preventDefault();e.returnValue=''}}window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[]);
 function change(value){latest.current=value;dirtyRef.current=true;setText(value);setDirty(true);setStatus('저장 대기');remember(value)}
 function keepMine(){revision.current=conflict.record?.revision||null;setConflict(null);remember(latest.current);setStatus('저장 대기')}
 function useShared(){const r=conflict.record;revision.current=r?.revision||null;latest.current=r?.text||'';dirtyRef.current=false;setText(latest.current);setDirty(false);setConflict(null);setStatus('저장됨');onSaved(field,r);try{sessionStorage.removeItem(draftKey(id,field))}catch{}}
 return <section className="researcher-note"><h2>연구자 생각 (<ResearcherName name={name}/>)</h2><textarea aria-label={`연구자 생각 (${name})`} placeholder="이 사례에 대한 생각을 적어주세요." value={text} readOnly={!ready} maxLength={20000} style={color?{color}:undefined} onChange={e=>change(e.target.value)} onBlur={()=>{if(!conflict)saveRef.current()}}/><div className="note-sync" role="status" aria-live="polite"><span>{!ready?(loadError||'노트 불러오는 중…'):status||'입력하면 자동 저장됩니다.'}</span>{ready&&!record&&!dirty&&text&&<button onClick={()=>change(text)}>기존 노트 공유 저장</button>}{dirty&&!conflict&&status!=='저장 중…'&&status!=='저장 대기'&&<button onClick={save}>다시 저장</button>}</div>{conflict&&<div className="note-conflict"><p>다른 창에서 이 노트가 변경됐습니다. 작성 내용은 보관되어 있습니다.</p><pre>{conflict.record?.text||'(빈 노트)'}</pre><button onClick={useShared}>공유 노트 불러오기</button><button onClick={keepMine}>내 내용으로 저장</button></div>}</section>
}
export default function SharedNotes({item,onSaveNote}){
 const [notes,setNotes]=useState({}),[ready,setReady]=useState(false),[loadError,setLoadError]=useState('');
 const generation=useRef(0);
 const saved=useCallback((field,record)=>{generation.current++;setNotes(n=>({...n,[field]:record}));onSaveNote?.({[field]:record?.text||''})},[onSaveNote]);
 useEffect(()=>{let stopped=false,busy=false;async function load(){if(busy||document.hidden||!isSyncActive())return;busy=true;const version=generation.current;try{const r=await fetch(`/api/notes?caseId=${encodeURIComponent(item.id)}`,{cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error);if(!stopped&&version===generation.current){setNotes(data.notes);setReady(true);setLoadError('')}}catch(error){if(!stopped)setLoadError(error.message||'노트를 불러오지 못했습니다. 다시 연결합니다.')}finally{busy=false}}load();const timer=setInterval(load,60000);window.addEventListener('focus',load);document.addEventListener('visibilitychange',load);return()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',load);document.removeEventListener('visibilitychange',load)}},[item.id]);
 return <div className="shared-notes">{ready&&loadError&&<p role="status">{loadError}</p>}{FIELDS.map(([field,name])=><NoteField key={field} id={item.id} field={field} name={name} seed={item[field]} color={field==='note'?item.noteColor:undefined} record={notes[field]} ready={ready} loadError={loadError} onSaved={saved}/>)}</div>
}
