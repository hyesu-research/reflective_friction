import React,{useState,useEffect} from 'react';
import initial from './data.json';
import curated from './curated.json';
import './style.css';
import CaseDetail from './CaseDetail';
import CaseForm from './CaseForm';
import {useHearts,HeartButton,ResearcherPicker} from './Hearts';
import HeartsOverview from './HeartsOverview';
import useSharedCases from './SharedCases';
import CollaborationPanel from './CollaborationPanel';
const PURPOSES=['학습·이해','판단·선택','행동·습관','감정·경험','자기·가치관','관계·사회적 영향'];
const WAYS=['질문·대화','단계·순서 조정','기록·피드백','역할·시점 전환','비교·선택'];
const FILTER_LABELS={"학습·이해": "Learning", "판단·선택": "Decision-making", "행동·습관": "Habits", "감정·경험": "Emotions", "자기·가치관": "Self & Values", "관계·사회적 영향": "Social Impact", "질문·대화": "Dialogue", "단계·순서 조정": "Sequencing", "기록·피드백": "Feedback", "역할·시점 전환": "Perspective Shift", "비교·선택": "Comparison", "공식 기능": "Official Feature", "공개 프롬프트": "Prompt", "확장 프로그램": "Extension", "확장 프로토타입": "Extension Prototype", "확장·프롬프트": "Extension + Prompt", "Claude 스킬": "Claude Skill", "일본 독립 앱": "Japanese App", "일본 GPTs": "Japanese GPT", "일본 공개 프롬프트": "Japanese Prompt", "연구자 개발 프롬프트": "Researcher-created Prompt"};
const ARCHIVED_IDS=['J03','J04','J05','A03','A05','A06','A07','A08'];
const TYPE_GROUPS=[{label:'Within AI',types:['Prompt','Skill','Extension','Plugin','Built-in Feature']},{label:'Standalone',types:['Website','App','Serious Game','Research','Art']}];
function caseTypes(x){const k=x.kind||'';const type=k.includes('아트')?'Art':k.includes('시리어스 게임')?'Serious Game':k.includes('플러그인')?'Plugin':k.includes('확장')?'Extension':k.includes('프롬프트')?'Prompt':k.includes('스킬')?'Skill':k.includes('GPTs')?'GPT':k.includes('공식 기능')?'Built-in Feature':k.includes('독립 앱')?'App':k.includes('웹사이트')?'Website':'';return [...(x.research?['Research']:[]),...(type?[type]:[])];}
function countCases(items,type){return items.filter(x=>!ARCHIVED_IDS.includes(x.id)&&(!type||caseTypes(x).includes(type))).length;}
const blank=()=>({id:crypto.randomUUID(),title:'',subtitle:'',kind:'공개 프롬프트',environment:'',timing:'',action:'',method:'',evidence:'자료 확인 필요',limits:'',sources:'',purposes:[],ways:[],image:'',imageSource:'',imageCredit:'',imageOriginal:'',overview:'',features:'',steps:'',conditions:'',note:'',professorNote:'',youngchanNote:'',jungwooNote:'',gallery:[],installation:[],classification:'사용자 분류'});
function withTypeThumbnail(x){
 if(['R07','R10'].includes(x.id)&&(x.kind||'').includes('확장'))x={...x,kind:x.kind.replace('확장 프로그램','플러그인')};
 if(x.thumbnailOverride&&x.image)return x;
 if((x.kind||'').includes('공식 기능')&&(!x.image||x.image==='/images/type-built-in.svg'))return {...x,image:'/images/type-built-in.svg',imageSource:'/images/type-built-in.svg',imageOriginal:'',imageCredit:'아카이브 제작 · 내장 기능 공통 썸네일'};
 if((x.kind||'').includes('스킬'))return {...x,image:'/images/type-skill.svg',imageSource:'/images/type-skill.svg',imageOriginal:'',imageCredit:'아카이브 제작 · 스킬 공통 썸네일'};
 const extension=(x.kind||'').includes('확장');
 const prompt=!extension&&(x.kind||'').includes('프롬프트');
 if(!extension&&!prompt)return x;
 const image=extension?'/images/type-extension.svg':'/images/type-prompt.svg';
 return {...x,image,imageSource:image,imageOriginal:'',imageCredit:extension?'아카이브 제작 · 확장 프로그램 공통 썸네일':'아카이브 제작 · 프롬프트 공통 썸네일'};
}
export default function Archive(){
 const hearts=useHearts();
 const [sort,setSort]=useState('hearts');
 const [overview,setOverview]=useState(false);
 const [exchange,setExchange]=useState(null);
 const[items,setItems]=useState(()=>{let saved;try{saved=JSON.parse(localStorage.getItem('reflective-v1'))}catch{}const xs=Array.isArray(saved)?saved:initial;return [...xs,...initial.filter(seed=>!xs.some(x=>x.id===seed.id))].map(x=>withTypeThumbnail(curated[x.id]&&(!x.curationVersion||x.curationVersion<curated[x.id].curationVersion)?{...x,...curated[x.id],note:x.note||''}:x))});
 const sharedCases=useSharedCases({setItems,localItems:items,seedIds:[...initial.map(x=>x.id),...ARCHIVED_IDS]});
 const [saving,setSaving]=useState(false),[caseConflict,setCaseConflict]=useState(null);
 const[purpose,setPurpose]=useState(''),[way,setWay]=useState(''),[kind,setKind]=useState(''),[more,setMore]=useState(false),[view,setView]=useState('grid'),[selected,setSelected]=useState(null),[draft,setDraft]=useState(null),[message,setMessage]=useState('');
 useEffect(()=>{try{localStorage.setItem('reflective-v1',JSON.stringify(items))}catch{setMessage('저장 공간이 부족합니다. 이미지를 줄이거나 JSON으로 내보내 주세요.')}},[items]);
 useEffect(()=>{function key(e){if(e.key==='Escape'&&!saving){closeCase();setDraft(null);setCaseConflict(null)}}window.addEventListener('keydown',key);document.body.style.overflow=selected||draft||overview||exchange?'hidden':'';return()=>window.removeEventListener('keydown',key)},[selected,draft,overview,saving,exchange]);
 useEffect(()=>{const sync=()=>setSelected(items.find(x=>!ARCHIVED_IDS.includes(x.id)&&x.id===decodeURIComponent(location.hash.slice(1)))||null);window.addEventListener('hashchange',sync);sync();return()=>window.removeEventListener('hashchange',sync)},[items]);
 function openCase(x){location.hash=encodeURIComponent(x.id);setSelected(x)}
 function closeCase(){history.replaceState(null,'',location.pathname+location.search);setSelected(null)}
 const shown=items.filter(x=>!ARCHIVED_IDS.includes(x.id)).sort((a,b)=>{const customImage=x=>Boolean(x.image&&!/^\/images\/type-/.test(x.image));const heartOrder=sort==='hearts'?(hearts.likes[b.id]?.length||0)-(hearts.likes[a.id]?.length||0):0;const imageOrder=!kind?Number(customImage(b))-Number(customImage(a)):0;const priority=id=>{const n=['W01','E17','E09','P17','P15','E16','F06'].indexOf(id);return n<0?99:n};return heartOrder||imageOrder||priority(a.id)-priority(b.id)}).filter(x=>(!purpose||x.purposes.includes(purpose))&&(!way||x.ways.includes(way))&&(!kind||caseTypes(x).includes(kind)));
 function beginEdit(x){if(!sharedCases.ready){setMessage('공동 사례를 불러온 뒤 다시 시도해주세요.');return}setCaseConflict(null);setDraft({...x,_sharedRevision:sharedCases.revision(x.id)})}
 async function save(e){e.preventDefault();if(saving)return;setSaving(true);setCaseConflict(null);try{const saved=await sharedCases.saveCase(withTypeThumbnail({...draft,gallery:(draft.gallery||[]).filter(image=>image.src?.trim())}),draft._sharedRevision||null);setDraft(null);location.hash=encodeURIComponent(saved.id);setSelected(saved);setMessage('사례를 공동 저장했습니다.')}catch(error){if(error.status===409)setCaseConflict(error.current);setMessage(error.message)}finally{setSaving(false)}}


 return <><header><a className="brand" href="/archive">Reflective Friction</a><div className="header-actions"><button className="overview-link" onClick={()=>setOverview(true)}>Perspectives</button><button className="login-link" onClick={async()=>{try{const response=await fetch('/api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});if(!response.ok)throw Error();location.assign('/login')}catch{setMessage('로그아웃하지 못했습니다. 다시 시도해주세요.')}}}>Log out</button><button className="add" disabled={!sharedCases.ready} onClick={()=>{setCaseConflict(null);setDraft({...blank(),_sharedRevision:null})}}>＋ Add case</button></div></header>
 <main>
 <section className="archive-controls chip-filters single-row-filters" aria-label="유형 필터"><div className="filter-chips" role="group" aria-label="Type"><button aria-pressed={!kind} onClick={()=>setKind('')}>All <span className="filter-count" style={{fontSize:'.7em',marginLeft:5,opacity:.65,fontVariantNumeric:'tabular-nums'}}>{countCases(items)}</span></button>{TYPE_GROUPS.flatMap(group=>group.types).map(type=><button key={type} aria-pressed={kind===type} onClick={()=>setKind(kind===type?'':type)}>{type} <span className="filter-count" style={{fontSize:'.7em',marginLeft:5,opacity:.65,fontVariantNumeric:'tabular-nums'}}>{countCases(items,type)}</span></button>)}</div><select className="heart-sort" aria-label="Sort cases" value={sort} onChange={e=>setSort(e.target.value)}><option value="default">Default</option><option value="hearts">Most liked</option></select></section>
 {sharedCases.error&&<p className="hearts-error" role="status">{sharedCases.error}</p>}
 {hearts.error&&<p className="hearts-error" role="status">{hearts.error}</p>}
 {shown.length===0&&<p className="empty-cases">아직 등록된 사례가 없습니다.</p>}
 <div className={view==='grid'?'grid':'rows'}>{shown.map((x,i)=><article className="card" key={x.id}><button className="card-image" aria-label={`${x.title} 상세 보기`} onClick={()=>openCase(x)}><div className={'visual tone'+(i%5)}>{x.image?<img src={x.image} alt={x.title+' 사례 화면'}/>:<div className="image-placeholder"><span className="image-glyph" aria-hidden="true"><svg width="38" height="38" viewBox="0 0 40 40" fill="none"><rect x="5" y="7" width="30" height="26" rx="3" stroke="currentColor" strokeWidth="1"/><circle cx="15" cy="15" r="3" stroke="currentColor"/><path d="M6 29L16 21L22 26L28 19L35 26" stroke="currentColor"/></svg></span></div>}</div></button><div className="card-body"><div className="card-title-row"><button className="card-title" onClick={()=>openCase(x)}><h2>{x.title}</h2></button><HeartButton id={x.id} title={x.title} hearts={hearts}/></div><span className="card-type">{caseTypes(x).join(' / ')}</span></div></article>)}</div>
 {!shown.length&&<div className="empty">조건에 맞는 사례가 없습니다.<br/><button onClick={()=>{setPurpose('');setWay('');setKind('')}}>필터 초기화</button></div>}
 <footer><span></span><div><button onClick={()=>setExchange('import')}>Import JSON</button><button onClick={()=>setExchange('export')}>Export JSON ↗</button></div></footer><div className="storage-note">사례·연구자 노트·하트는 공동 저장됩니다.</div>
 {message&&<div role="status" className="toast" onClick={()=>setMessage('')}>{message} <span>×</span></div>}</main>
 {selected&&!draft&&<CaseDetail key={selected.id} onSaveNote={changes=>{setItems(xs=>xs.map(x=>x.id===selected.id?{...x,...changes}:x));setSelected(current=>current?{...current,...changes}:current)}} item={selected} onClose={closeCase} onEdit={()=>beginEdit(selected)}/>}
 {overview&&<HeartsOverview hearts={hearts} items={items.filter(x=>!ARCHIVED_IDS.includes(x.id))} onClose={()=>setOverview(false)} onOpen={x=>{setOverview(false);openCase(x)}}/>}
 {exchange&&<CollaborationPanel key={exchange} mode={exchange} seeds={initial.map(x=>withTypeThumbnail({...x,...curated[x.id]}))} archivedIds={ARCHIVED_IDS} sharedCases={sharedCases} prepareCase={withTypeThumbnail} onClose={()=>setExchange(null)}/>}
 <ResearcherPicker open={hearts.choosing} onChoose={hearts.choose} onClose={hearts.close}/>
 {draft&&<CaseForm draft={draft} setDraft={setDraft} onSave={save} onClose={()=>{if(!saving){setDraft(null);setCaseConflict(null)}}} isEditing={items.some(x=>x.id===draft.id)} saving={saving} conflict={caseConflict} onReloadConflict={()=>{setDraft({...draft,...caseConflict.item,_sharedRevision:caseConflict.revision});setCaseConflict(null)}} notify={setMessage}/>}
 </>;
}
