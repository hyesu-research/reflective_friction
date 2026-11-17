// Stop background database reads after five minutes without interaction.
let lastActivity=Date.now();
const touch=()=>{lastActivity=Date.now()};
if(typeof window!=='undefined')for(const event of ['pointerdown','keydown','wheel','focus'])window.addEventListener(event,touch,{passive:true});
export const isSyncActive=()=>Date.now()-lastActivity<5*60*1000;
