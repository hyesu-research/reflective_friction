import React,{useState} from 'react';

export default function LoginPage() {
  const[id,setId]=useState('');
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  async function enter(event){
    event.preventDefault();
    if(busy)return;
    if(!id.trim()){setError('아이디를 입력해주세요.');return;}
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/access',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({id})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'입장하지 못했습니다. 다시 시도해주세요.');
      const hash=/^#[A-Za-z0-9_-]+$/.test(location.hash)?location.hash:'';
      location.assign('/archive'+hash);
    }catch(error){setError(error.message||'연결을 확인하고 다시 시도해주세요.');setBusy(false);}
  }
  return <div className="login-page">
    <header className="login-header"><a className="brand" href="/login">Reflective Friction</a></header>
    <main className="login-main"><section className="login-content" aria-labelledby="login-title">
      <h1 id="login-title">Login</h1>
      <form className="login-form" onSubmit={enter}>
        <label htmlFor="archive-id">ID</label>
        <input id="archive-id" name="archive-id" type="text" value={id} onChange={event=>{setId(event.target.value);setError('')}} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={128} required aria-invalid={Boolean(error)} aria-describedby={error?'login-error':undefined} disabled={busy}/>
        {error&&<p id="login-error" className="login-error" role="alert">{error}</p>}
        <button className="login-action" type="submit" disabled={busy}><span>{busy?'Logging in…':'Login'}</span><span aria-hidden="true">↗</span></button>
      </form>
    </section></main>
  </div>;
}
