import {sanitizeCase} from '../lib/case-validation.js';
export const SCHEMA='reflective-friction.collaboration';
export const NOTE_FIELDS={professorNote:'윤재영',note:'김혜수',youngchanNote:'박영찬',jungwooNote:'배정우'};
const TYPES={'Prompt':'공개 프롬프트','Skill':'Claude 스킬','Extension':'확장 프로그램','Plugin':'플러그인','Built-in Feature':'공식 기능','Website':'웹사이트','App':'독립 앱','Serious Game':'시리어스 게임','Art':'아트'};
const READ_ONLY=new Set(['researcherNotes','likedBy','archiveMeta','types','sourceUrls','note','professorNote','youngchanNote','jungwooNote','_sharedRevision','curationVersion','thumbnailOverride']);
export function mergeSharedSeeds(seeds,records={}){const map=new Map(seeds.map(x=>[x.id,{...x}]));for(const r of Object.values(records))if(r?.item?.id)map.set(r.item.id,{...map.get(r.item.id),...r.item});return [...map.values()]}
export function canonicalSource(value){try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol))return '';u.hash='';u.hostname=u.hostname.toLowerCase().replace(/^www\./,'');for(const k of [...u.searchParams.keys()])if(/^utm_/i.test(k)||['fbclid','gclid'].includes(k))u.searchParams.delete(k);u.searchParams.sort();u.pathname=u.pathname.replace(/\/+$/,'')||'/';if(u.hostname==='arxiv.org'){const m=u.pathname.match(/^\/(?:abs|html|pdf)\/(\d+\.\d+)(?:v\d+)?(?:\.pdf)?$/);if(m)return 'https://arxiv.org/abs/'+m[1]}if(u.hostname==='doi.org')return 'https://doi.org/'+u.pathname.slice(1).toLowerCase();if(u.hostname==='dl.acm.org'&&u.pathname.startsWith('/doi/'))return 'https://doi.org/'+u.pathname.slice(5).toLowerCase();return u.toString()}catch{return ''}}
const titleKey=t=>String(t||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
function sourceKeys(item){return new Set(String(item.sources||'').split(/\s+/).map(canonicalSource).filter(Boolean))}
function stable(x){if(Array.isArray(x))return x.map(stable);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])]));return x}
export function changedFields(before,after){return Object.keys(after).filter(k=>!READ_ONLY.has(k)&&k!=='id'&&!(before&&before[k]===undefined&&(after[k]===''||after[k]===false||Array.isArray(after[k])&&!after[k].length))&&JSON.stringify(stable(before?.[k]))!==JSON.stringify(stable(after[k])))}
function absolute(value,origin){return typeof value==='string'&&value.startsWith('/')?new URL(value,origin).href:value}
export function buildExport({seeds,snapshot,origin,includeNotes=false,includeHearts=true,includeArchived=false,archivedIds=[]}){
 const hidden=new Set(archivedIds),items=mergeSharedSeeds(seeds,snapshot.records).filter(x=>includeArchived||!hidden.has(x.id));
 const cases=items.map(x=>{const c=sanitizeCase(x);for(const key of ['image','imageSource','imageOriginal','skillFile','skillZip','promptFile','promptOriginalFile'])if(c[key])c[key]=absolute(c[key],origin);if(c.gallery)c.gallery=c.gallery.map(g=>({...g,src:absolute(g.src,origin),source:absolute(g.source,origin)}));if(c.installation)c.installation=c.installation.map(s=>({...s,...s.links?{links:s.links.map(l=>({...l,url:absolute(l.url,origin)}))}:{}}));
  c.archiveMeta={revision:snapshot.records?.[x.id]?.revision||null,updatedAt:snapshot.records?.[x.id]?.updatedAt||null,archived:hidden.has(x.id)};
  if(includeHearts)c.likedBy=snapshot.likes?.[x.id]||[];
  if(includeNotes){c.researcherNotes={};for(const [field,name]of Object.entries(NOTE_FIELDS)){const r=snapshot.notes?.[x.id]?.[field];c.researcherNotes[name]={text:r?r.text:String(x[field]||''),updatedAt:r?.updatedAt||null}}}
  return c;
 });
 return {schema:SCHEMA,schemaVersion:1,exportedAt:new Date().toISOString(),archiveUrl:origin,includes:{researcherNotes:includeNotes,hearts:includeHearts,archivedCases:includeArchived,imageFiles:false},...includeNotes||includeHearts?{researchers:Object.values(NOTE_FIELDS).map(name=>({name,...name==='윤재영'?{role:'PI'}:{}}))}:{},cases};
}
function localizeUrl(value,origin){if(typeof value!=='string')return value;try{const u=new URL(value);if(u.origin===origin)return u.pathname+u.search+u.hash}catch{}return value}
function prepareEntry(raw,origin){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('사례는 JSON 객체여야 합니다.');const x={...raw};for(const k of READ_ONLY)delete x[k];if(Array.isArray(x.sources))x.sources=x.sources.join('\n');if(!x.sources&&Array.isArray(raw.sourceUrls))x.sources=raw.sourceUrls.join('\n');const type=raw.type||raw.types?.find(t=>t!=='Research');if(TYPES[x.kind])x.kind=TYPES[x.kind];if(!x.kind&&TYPES[type])x.kind=TYPES[type];if(raw.types?.includes('Research')&&x.research===undefined)x.research=true;delete x.type;for(const key of ['image','imageSource','imageOriginal','skillFile','skillZip','promptFile','promptOriginalFile'])if(x[key])x[key]=localizeUrl(x[key],origin);if(Array.isArray(x.gallery))x.gallery=x.gallery.map(g=>({...g,src:localizeUrl(g.src,origin),source:localizeUrl(g.source,origin)}));if(Array.isArray(x.installation))x.installation=x.installation.map(s=>({...s,...Array.isArray(s.links)?{links:s.links.map(l=>({...l,url:localizeUrl(l.url,origin)}))}:{}}));return x}
function validateImport(item){
 const rawImages=[];const check=src=>{if(typeof src==='string'&&src.startsWith('data:')){if(!/^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,[A-Za-z0-9+/=\r\n]+$/.test(src)||src.length>2100000)throw Error('이미지는 1.5MB 이하 PNG·JPEG·WebP·GIF·AVIF만 가능합니다.');rawImages.push(src);return '/images/import-media'}return src};
 const forValidation={...item,image:check(item.image||''),gallery:(item.gallery||[]).map(g=>({...g,src:check(g.src)}))};let clean;try{clean=sanitizeCase(forValidation)}catch(e){throw Error('사례명·유형·이미지 URL과 입력 형식을 확인해주세요.')} if(!String(clean.sources||'').split(/\s+/).some(u=>/^https?:\/\//.test(u))&&!clean.promptCredit&&!clean.author)throw Error('출처 URL 또는 직접 만든 자료의 작성자 정보가 필요합니다.');if(rawImages.length){clean.image=item.image||'';clean.gallery=(item.gallery||[]).map((g,i)=>({...clean.gallery[i],src:g.src}))}return clean;
}
export function parseImport(text){const data=JSON.parse(text);if(!Array.isArray(data)&&data?.schema&&data.schema!==SCHEMA)throw Error('지원하지 않는 JSON 형식입니다.');if(!Array.isArray(data)&&data?.schemaVersion&&data.schemaVersion!==1)throw Error('지원하지 않는 양식 버전입니다.');const cases=Array.isArray(data)?data:data?.cases;if(!Array.isArray(cases)||!cases.length||cases.length>1000)throw Error('cases 배열에 1~1,000개 사례를 넣어주세요.');return cases}
export function planImport(rawCases,existing,origin,idFactory=()=>crypto.randomUUID()){
 const ids=new Map(existing.map(x=>[x.id,x])),seenIds=new Set(),seenTitles=new Set();
 return rawCases.map((raw,index)=>{const row={key:index,title:raw?.title||raw?.id||`사례 ${index+1}`,raw,candidates:[]};try{
  const incoming=prepareEntry(raw,origin);if(incoming.id&&seenIds.has(incoming.id))throw Error('파일 안에 같은 ID가 두 번 있습니다.');if(incoming.id)seenIds.add(incoming.id);if(!incoming.id)incoming.id=idFactory();
  const exact=ids.get(incoming.id),key=titleKey(incoming.title||exact?.title),urls=sourceKeys(incoming);
  row.candidates=exact?[exact]:existing.filter(x=>key&&titleKey(x.title)===key||[...sourceKeys(x)].some(u=>urls.has(u)));
  const repeated=key&&seenTitles.has(key);if(key)seenTitles.add(key);
  row.incoming=incoming;row.newId=exact?idFactory():incoming.id;
  const merged=exact?{...exact,...incoming}:incoming;
  try{row.item=validateImport(merged)}catch(e){if(!exact&&row.candidates.length){row.item=validateImport({...row.candidates[0],...incoming,id:row.candidates[0].id})}else throw e}
  row.changes=exact?changedFields(sanitizeCase(exact),row.item):[];
  row.status=exact?(row.changes.length?'update':'unchanged'):(row.candidates.length||repeated?'duplicate':'new');row.reason=repeated?'파일 안에서 사례명이 반복됩니다.':row.candidates.length&&!exact?'같은 이름 또는 출처를 가진 기존 사례가 있습니다.':'';
  row.defaultAction=row.status==='new'?'new':'skip';return row;
 }catch(e){return {...row,status:'invalid',error:e.message,defaultAction:'skip'}}});
}
export function resolveImport(row,action,existing){if(action==='skip')return null;const target=action.startsWith('update:')?existing.find(x=>x.id===action.slice(7)):null;if(action.startsWith('update:')&&!target)throw Error('수정할 사례를 찾을 수 없습니다.');const item=validateImport({...target,...row.incoming,id:target?.id||row.newId});if(row.incoming.image&&row.incoming.image!==target?.image&&/(프롬프트|확장|스킬)/.test(item.kind)&&!/^\/images\/type-/.test(item.image))item.thumbnailOverride=true;return {item,target,changes:changedFields(target?sanitizeCase(target):null,item)}}
export const FORMAT_GUIDE=`# Reflective Friction · 다른 AI와 협업하는 JSON 양식

아카이브의 Export JSON에서 최신 공동 저장 자료를 내려받을 수 있습니다. 연구자 노트와 하트 포함 여부는 사용자가 선택합니다. 파일 다운로드는 다른 AI로의 자동 전송이 아닙니다.

## 다른 AI에게 전달할 요청
사례의 공식 명칭과 1차 출처를 확인하고 아래 양식으로 정리해주세요. 기존 사례를 수정할 때는 id를 유지하고, 새 사례는 id를 생략하세요. 확인하지 못한 기능·효과·이용률은 만들어내지 마세요. 연구자 노트와 likedBy는 사람이 남긴 참고 자료이며 수정하거나 새로 만들어 넣지 마세요.

## 가져올 파일 예시
예시 값을 실제 사례와 출처로 바꾼 뒤 JSON 파일로 저장하세요.

\`\`\`json
{"schema":"reflective-friction.collaboration","schemaVersion":1,"cases":[{"title":"실제 사례명","type":"Website","research":false,"overview":"어떤 서비스 또는 기능인지","features":"확인된 주요 기능","action":"사용자가 하는 일","method":"작동 방식","steps":"첫 단계\\n다음 단계","conditions":"이용 조건","sources":["https://example.org/official-source"],"image":"https://example.org/screenshot.png","imageCredit":"제작자명","imageSource":"https://example.org/official-source","gallery":[],"purposes":[],"ways":[]}]}
\`\`\`

## 필드
- title: 사례명. 필수.
- id: 기존 사례의 식별자. 수정 시 유지하고 새 사례는 생략할 수 있습니다.
- type: Prompt / Skill / Extension / Plugin / Built-in Feature / Website / App / Serious Game / Art.
- kind: 기존 파일의 한국어 유형을 그대로 사용해도 됩니다. type 또는 kind가 필요합니다.
- research: 연구 프로젝트·프로토타입이면 true. 제공 형태(type)와 별도로 기록합니다.
- sources: 공식 링크. 문자열(한 줄에 URL 하나) 또는 URL 배열. 직접 만든 프롬프트는 author 또는 promptCredit에 작성자를 명시할 수 있습니다.
- overview, features, action, method, steps, conditions: 설명·기능·사용자 행동·작동 방식·이용 방법·이용 조건.
- image, imageSource, imageCredit: 썸네일 주소·출처 페이지·크레딧.
- gallery: [{"src":"이미지 주소","caption":"설명","source":"출처 페이지","credit":"제작자","type":"공식 화면"}].
- prompt, promptCredit: 프롬프트 전문과 출처·작성자. 해당 사례만.
- installation: [{"title":"단계명","text":"설명","code":"선택 명령어","links":[]}]. 해당 사례만.

## 참고 자료와 반영 범위
- researcherNotes와 likedBy는 내보내기 전용 참고 자료입니다. 가져오기로 노트나 하트를 덮어쓰지 않습니다.
- archiveMeta는 내보낸 시점의 버전 정보입니다. 가져오기 전에 서버의 최신 사례와 다시 비교합니다.
- 이미지 파일 자체가 아닌 주소를 내보냅니다. 아카이브 내부 이미지 주소는 로그인이 필요하므로 외부 AI가 내용을 확인했다고 가정하지 마세요.
- 기존 JSON 배열도 가져올 수 있습니다. 미리보기에서 중복과 변경 항목을 확인하고 반영할 사례를 선택합니다.
- 가져오기 과정에서 다른 사람이 사례를 수정하면 해당 건은 충돌로 남겨두며, 이미 반영한 다른 건은 유지됩니다.
`;
