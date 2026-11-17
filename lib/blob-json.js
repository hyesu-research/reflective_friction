// Compressed delivery may return a weak HTTP ETag. Resolve it to the
// storage metadata ETag, verifying both refer to the same content version.
const entity=tag=>String(tag||'').replace(/^W\//,'').replace(/^"|"$/g,'');
export async function readBlobJson(blob,path){
 if(blob.readJson)return blob.readJson(path);
 for(let attempt=0;attempt<4;attempt++){
  const r=await blob.get(path,{access:'private',useCache:false,headers:{'accept-encoding':'identity'}});
  if(!r)return {data:null,etag:null};
  if(r.statusCode!==200||!r.stream)throw Error('Storage read failed');
  const data=await new Response(r.stream).json();
  const meta=await blob.head(path);
  if(meta.etag&&entity(meta.etag)===entity(r.blob.etag))return {data,etag:meta.etag};
 }
 throw Error('Storage changed while reading; retry');
}
