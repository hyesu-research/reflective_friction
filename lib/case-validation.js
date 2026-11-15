const strings=['id','title','kind','subtitle','environment','timing','overview','features','action','method','steps','conditions','sources','sourceLabel','image','imageSource','imageCredit','imageOriginal','classification','evidence','limits','reviewStatus','reviewText','prompt','promptCredit','promptFile','promptOriginal','promptOriginalCredit','author','promptHeading','promptLicense','promptOriginalFile','promptOriginalLabel','skillFile','skillZip','skillVersion','downloadNote','skillIntro','usageExample','noteColor'];
export function sanitizeCase(item){
 if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Invalid case');
 if(typeof item.id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(item.id)||['constructor','prototype'].includes(item.id)||typeof item.title!=='string'||!item.title.trim()||item.title.length>300||typeof item.kind!=='string'||!item.kind.trim())throw Error('Invalid identity');
 const clean={};for(const k of strings){if(item[k]!==undefined){if(typeof item[k]!=='string'||item[k].length>100000)throw Error('Invalid field');clean[k]=item[k]}}
 const media=u=>typeof u==='string'&&(!u||/^https?:\/\//.test(u)||/^\/(?!\/)[^\\\u0000]*$/.test(u));
 for(const k of ['image','imageSource','imageOriginal','promptFile','promptOriginalFile','skillFile','skillZip'])if(clean[k]&&!media(clean[k]))throw Error('Invalid media URL');
 for(const k of ['research','thumbnailOverride'])if(typeof item[k]==='boolean')clean[k]=item[k];
 if(Number.isFinite(item.curationVersion))clean.curationVersion=item.curationVersion;
 for(const k of ['purposes','ways']){const a=item[k]||[];if(!Array.isArray(a)||a.length>30||a.some(x=>typeof x!=='string'||x.length>150))throw Error('Invalid tags');clean[k]=a}
 for(const [k,allowed,max] of [['gallery',['src','caption','source','credit','type','layout'],30],['installation',['title','text','code','links'],30],['usageFlow',['role','text'],30]]){
  if(item[k]===undefined)continue;if(!Array.isArray(item[k])||item[k].length>max)throw Error('Invalid list');
  clean[k]=item[k].map(x=>{if(!x||typeof x!=='object')throw Error('Invalid entry');const out={};for(const key of allowed){if(x[key]===undefined)continue;if(key==='links'){if(!Array.isArray(x.links)||x.links.length>15)throw Error('Invalid links');out.links=x.links.map(l=>{if(typeof l.label!=='string'||l.label.length>300||!media(l.url))throw Error('Invalid link');return {label:l.label,url:l.url}})}else{if(typeof x[key]!=='string'||x[key].length>50000)throw Error('Invalid text');if(['src','source'].includes(key)&&!media(x[key]))throw Error('Invalid URL');out[key]=x[key]}}return out})
 }
 if(JSON.stringify(clean).length>400000)throw Error('Case too large');return clean;
}
