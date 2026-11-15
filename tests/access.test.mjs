import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import access from '../api/access.js';
import archive from '../api/archive.js';
import { digestId } from '../lib/archive-access.js';

test('issued ID, protected resources, invalid sessions, revocation, logout and CSRF',async()=>{
 process.env.NODE_ENV='test';process.env.ARCHIVE_SESSION_SECRET=randomBytes(48).toString('base64url');
 const code='DL-123456-ABCDEF-654321-FEDCBA';
 const config=JSON.stringify([{label:'test',digest:digestId(code)}]);process.env.ARCHIVE_ACCESS_IDS=config;
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');req.query=Object.fromEntries(url.searchParams);
  res.status=n=>{res.statusCode=n;return res};res.json=x=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(x));return res};res.send=x=>{res.end(x);return res};
  let body='';for await(const part of req)body+=part;req.body=body;
  await(url.pathname==='/api/access'?access:archive)(req,res);
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 try{
  let r=await fetch(origin+'/archive',{redirect:'manual',headers:{Accept:'text/html'}});assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/login');
  r=await fetch(origin+'/api/archive?file=assets/archive.js');assert.equal(r.status,401);
  const post=(body,headers={})=>fetch(origin+'/api/access',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  r=await post({id:'not-an-issued-id'});assert.equal(r.status,401);
  r=await post({id:code},{Origin:'https://evil.example'});assert.equal(r.status,403);
  r=await post({id:code.toLowerCase()});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];assert.match(r.headers.get('set-cookie'),/HttpOnly/i);
  r=await fetch(origin+'/api/access',{headers:{Cookie:cookie}});assert.equal((await r.json()).authenticated,true);
  r=await fetch(origin+'/api/archive?file=index.html',{headers:{Cookie:cookie}});assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);
  r=await fetch(origin+'/api/archive?file=../package.json',{headers:{Cookie:cookie}});assert.equal(r.status,400);
  r=await fetch(origin+'/api/access',{headers:{Cookie:cookie.slice(0,-8)+'tampered'}});assert.equal((await r.json()).authenticated,false);
  process.env.ARCHIVE_ACCESS_IDS='[]';r=await fetch(origin+'/api/access',{headers:{Cookie:cookie}});assert.equal((await r.json()).authenticated,false);
  process.env.ARCHIVE_ACCESS_IDS=config;r=await post({action:'logout'},{Cookie:cookie});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/i);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
