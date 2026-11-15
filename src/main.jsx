import React,{lazy,Suspense} from 'react';
import{createRoot}from'react-dom/client';
import LoginPage from './LoginPage';
import './style.css';
const Archive=lazy(()=>import('./Archive'));
const archiveRoute=location.pathname.replace(/\/+$/,'')==='/archive'||(location.pathname==='/'&&Boolean(location.hash));
// Old hash links arrive at the public entry, then submit the ID before loading case data.
createRoot(document.getElementById('root')).render(archiveRoute&&location.pathname!=='/'?<Suspense fallback={<p className="access-loading" role="status">불러오는 중…</p>}><Archive/></Suspense>:<LoginPage/>);
