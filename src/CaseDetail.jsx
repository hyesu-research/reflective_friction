import React from 'react';
import SharedNotes from './SharedNotes';
import curated from './curated.json';
import SkillResources,{CopyText} from './SkillResources';
import PromptResources from './PromptResources';
function Screen({image}){return <figure className={"detail-screen"+(image.layout==='portrait'?' portrait':'')}><a href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.caption} loading="lazy"/></a><figcaption><span>{image.caption}</span><a href={image.source} target="_blank" rel="noreferrer">{image.type} · {image.credit} ↗</a></figcaption></figure>}
export default function CaseDetail({item:x,onClose,onEdit,onSaveNote}){
 const reflect=x.id==='F06';
 const gallery=x.gallery||curated[x.id]?.gallery||[];
 const links=(x.sources||'').split(/\s+/).filter(s=>/^https?:\/\//.test(s));
 return <section className="case-page" role="dialog" aria-modal="true" aria-label={x.title}>
 <nav className="case-nav"><a className="brand" href="/archive" onClick={e=>{e.preventDefault();onClose()}}>Reflective Friction</a><button onClick={onEdit}>수정</button></nav>
 <article className="case-article text-detail"><h1>{x.title}</h1>
 <div className="case-columns"><div className="case-body">
 <section className="case-description"><p>{x.overview||[x.subtitle,x.environment&&`사용 환경: ${x.environment}`].filter(Boolean).join('. ')||'기능 설명을 추가해주세요.'}</p>{x.features&&<p>{x.features}</p>}<p>{x.action}</p><p>{x.method}</p></section>
 {x.skillFile&&<SkillResources key={x.id} item={x}/>}
 {x.usageFlow&&<section className="skill-example"><h2>사용 흐름 예시</h2><p className="example-credit">작동 방식을 설명하기 위해 아카이브에서 구성한 예시입니다.</p><dl>{x.usageFlow.map((line,i)=><div key={i}><dt>{line.role}</dt><dd>{line.text}</dd></div>)}</dl></section>}
 {x.skillIntro&&<section><h2>스킬은 어떻게 쓰나요?</h2><p>{x.skillIntro}</p></section>}
 {x.installation?.length>0&&<section className="skill-install"><h2>설치하고 실행하기</h2><ol>{x.installation.map((step,i)=><li key={i}><h3>{step.title}</h3><p>{step.text}</p>{step.code&&<div className="install-command"><CopyText text={step.code} label="명령 복사"/><pre><code>{step.code}</code></pre></div>}{step.links?.map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</li>)}</ol></section>}
 {gallery[1]&&<Screen image={gallery[1]}/>}
 {x.steps&&<section><h2>이용 방법</h2><ol className="plain-steps">{x.steps.split('\n').filter(Boolean).map((step,i)=><li key={i}>{step}</li>)}</ol></section>}
 
 
 {gallery[0]&&<Screen image={gallery[0]}/>}
 {x.prompt&&<PromptResources key={x.id} item={x}/>}
 {x.conditions&&<section><h2>이용 조건</h2><p>{x.conditions}</p></section>}
 {gallery.slice(2).map(image=><Screen key={image.src} image={image}/>)}
 
 {x.reviewStatus&&<section><h2>{x.reviewStatus}</h2><p>{x.reviewText}</p></section>}
 <SharedNotes key={x.id} item={x} onSaveNote={onSaveNote}/>
 </div><aside className="case-aside"><dl><dt>사용 환경</dt><dd>{x.environment}</dd><dt>형태</dt><dd>{x.kind}</dd><dt>개입 시점</dt><dd>{x.timing}</dd></dl>
 <div className="aside-sources"><h3>출처</h3>{x.sourceLabel&&<p>{x.sourceLabel}</p>}{links.map((s,i)=><a href={s} key={s} target="_blank" rel="noreferrer">{reflect?(i===0?'Anthropic 소개':'Claude 도움말'):new URL(s).hostname.replace(/^www\./,'')} ↗</a>)}</div>
 {x.image&&<div className="aside-sources image-credit"><h3>썸네일 출처</h3>{x.imageSource?<><a href={x.imageSource} target="_blank" rel="noreferrer">{x.imageCredit||'이미지 제공 페이지'} ↗</a>{x.imageOriginal&&<a href={x.imageOriginal} target="_blank" rel="noreferrer">원본 이미지 ↗</a>}</>:<p>{x.imageCredit||'출처 미기재'}</p>}</div>}
 </aside></div><div className="case-bottom"><button onClick={onClose}>← 사례 목록으로</button></div></article></section>
}
