import React,{useEffect,useState} from 'react';
export function CopyText({text,label='복사',disabled=false}){
 const [status,setStatus]=useState('');
 async function copy(){try{await navigator.clipboard.writeText(text);setStatus('복사됨')}catch{setStatus('복사하지 못했어요. 내용을 선택해 복사해 주세요.')}}
 return <><button type="button" disabled={disabled} onClick={copy}>{status==='복사됨'?status:label}</button>{status&&status!=='복사됨'&&<span role="status">{status}</span>}</>;
}
export default function SkillResources({item:x}){
 const [source,setSource]=useState(''),[error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();setSource('');setError(false);fetch(x.skillFile,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.text()}).then(t=>{if(!t.startsWith('---')||!t.includes('name:'))throw Error();setSource(t)}).catch(e=>{if(e.name!=='AbortError')setError(true)});return()=>controller.abort()},[x.skillFile]);
 return <section className="skill-resources" aria-label="스킬 저장과 원문"><h2>스킬 저장</h2><div className="skill-actions"><a href={x.skillZip} download>ZIP 저장 ↓</a><a href={x.skillFile} download="SKILL.md">SKILL.md 저장 ↓</a><CopyText text={source} label="원문 전체 복사" disabled={!source}/></div><p className="skill-version">{x.skillVersion}</p><p>{x.downloadNote}</p><details className="skill-source"><summary>SKILL.md 원문 전체 보기</summary>{error?<p role="alert">원문을 불러오지 못했습니다. 새로고침하거나 출처 링크에서 확인해 주세요.</p>:source?<pre>{source}</pre>:<p role="status">원문 불러오는 중…</p>}</details>{x.usageExample&&<div className="skill-launch"><div className="prompt-heading"><h3>첫 실행 문구</h3><CopyText text={x.usageExample}/></div><pre>{x.usageExample}</pre></div>}</section>;
}
