/* Shared across MX App Center and independent apps. No names, notes, or calculation inputs are sent. */
(function(){
'use strict';
const END='https://aircraft-reference-usage.wgy9sy6b59.workers.dev/app-event';
const app=(document.currentScript?.dataset?.mxApp||'unknown').toLowerCase();
const fixed=(document.currentScript?.dataset?.mxPage||'').toLowerCase();
const clean=x=>String(x||'').toLowerCase().replace(/[^a-z0-9_./:-]/g,'-').slice(0,85)||'home';
function getVisitor(){try{let id=localStorage.getItem('acmx-reference-visitor-v1');if(!id){id=crypto.randomUUID();localStorage.setItem('acmx-reference-visitor-v1',id)}return id}catch{return crypto.randomUUID()}}
const visitor=getVisitor();let lastPage='';
function page(){return clean(fixed||(location.pathname.split('/').pop()||'home').replace(/\.html$/,'')+(location.hash||''))}
function send(event,p=page()){
 const payload={event,app:clean(app),page:clean(p),visitor,eventId:crypto.randomUUID()};
 try{fetch(END,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true,mode:'cors'}).catch(()=>{})}catch{}
}
function view(){const p=page();if(p!==lastPage){lastPage=p;send('page',p)}}
window.MXTrack={send,view};
send('open');view();
window.addEventListener('hashchange',view);
window.addEventListener('popstate',view);
const origPush=history.pushState,origReplace=history.replaceState;
history.pushState=function(){const ret=origPush.apply(this,arguments);view();return ret};
history.replaceState=function(){const ret=origReplace.apply(this,arguments);view();return ret};
document.addEventListener('click',e=>{
 const element=e.target.closest('[data-mx-track]');if(element)send('action',clean(element.dataset.mxTrack));
 const link=e.target.closest('a[href]');if(link&&link.hostname&&link.hostname!==location.hostname)send('launch',clean(link.getAttribute('data-mx-app')||'external'));
},true);
})();
