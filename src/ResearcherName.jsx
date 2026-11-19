import React from 'react';
export const RESEARCHER_COLORS={'윤재영':'#294b78','김혜수':'#704095','박영찬':'#31634c','배정우':'#945020'};
export default function ResearcherName({name}){return <span className="researcher-name" style={{color:RESEARCHER_COLORS[name]}}>{name}{name==='윤재영'&&<small className="researcher-pi" title="연구책임자 · Principal Investigator">PI</small>}</span>}
export function ResearcherNames({names}){return <>{names.map((name,i)=><React.Fragment key={name}>{i>0?' · ':''}<ResearcherName name={name}/></React.Fragment>)}</>}
