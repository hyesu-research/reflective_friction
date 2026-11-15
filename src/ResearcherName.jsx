import React from 'react';
export default function ResearcherName({name}){return <span className="researcher-name">{name}{name==='윤재영'&&<small className="researcher-pi" title="연구책임자 · Principal Investigator">PI</small>}</span>}
export function ResearcherNames({names}){return <>{names.map((name,i)=><React.Fragment key={name}>{i>0?' · ':''}<ResearcherName name={name}/></React.Fragment>)}</>}
