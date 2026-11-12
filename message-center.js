/* FedEx MX Executive V4 Message Center extension.
   Add <script src="./message-center.js" defer></script> immediately before </body> in usage.html.
   Requires existing dashboard authentication and the updated Cloudflare Worker + D1 migration.
*/
(()=>{
'use strict';
const root=document.getElementById('report');
if(!root||document.getElementById('messageCenter'))return;
const css=document.createElement('style');
css.textContent=`
.mc-section{border-color:#615b9b!important;background:linear-gradient(125deg,#1b2345f7,#102438f8)!important;box-shadow:0 0 25px #8160ed25,inset 0 1px #ffffff18!important}
.mc-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.mc-head h2{margin:7px 0}.mc-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.mc-bubble{display:inline-block;min-width:24px;text-align:center;border-radius:99px;padding:4px 8px;margin-left:7px;background:#d8656c;color:#fff;font-size:11px;font-weight:900}
.mc-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:15px 0}
.mc-mini{background:#122942;border:1px solid #48617e;border-radius:12px;padding:12px;min-width:0}
.mc-mini strong{display:block;font-size:24px;line-height:1.3;font-variant-numeric:tabular-nums}.mc-mini span{display:block;color:#b8cadf;font-size:11px}
.mc-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
.mc-tools select{background:#11253a;border:1px solid #57758e;color:#f3f7ff;border-radius:10px;padding:11px;min-height:43px;font-size:14px}
.mc-list{display:grid;gap:11px}.mc-item{border:1px solid #405776;border-radius:14px;background:#101e33;padding:15px;min-width:0}
.mc-item.new{border-color:#a48dff;box-shadow:inset 3px 0 #9d83ff}
.mc-item-top{display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap}
.mc-item h3{font-size:15px;color:#f0f4ff;text-transform:none;letter-spacing:0;margin:0 0 7px}
.mc-meta{font-size:11px;color:#aabed9;line-height:1.6}.mc-message{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.65;color:#e5eefb;margin:14px 0}
.mc-status{padding:5px 9px;border-radius:8px;background:#283854;border:1px solid #617398;color:#dce8ff;font-size:11px;font-weight:800}
.mc-status.new{background:#45365f;color:#e7d9ff;border-color:#9d83ff}
.mc-item-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:end;margin-top:12px}
.mc-item-actions label{flex:1 1 150px;min-width:0;font-size:11px;color:#adc6df}
.mc-item-actions textarea,.mc-item-actions select{display:block;width:100%;margin-top:6px;background:#0b1a2b;color:white;border:1px solid #58728d;border-radius:9px;padding:10px;font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:41px}
.mc-item-actions textarea{min-height:68px;resize:vertical;line-height:1.45}
.mc-item-actions button{min-height:41px}.mc-state{color:#b9cee3;font-size:12px;line-height:1.5}
@media(max-width:580px){.mc-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.mc-item-actions{display:grid;grid-template-columns:1fr}.mc-item-actions label{width:100%}}
`;
document.head.appendChild(css);
const section=document.createElement('section');section.id='messageCenter';section.className='mc-section';
section.setAttribute('aria-labelledby','mcTitle');
section.innerHTML=`<div class="mc-head"><div><div class="section-kicker">02 / Team feedback</div><h2 id="mcTitle">Message Center <span class="mc-bubble" id="mcUnread" hidden>0</span></h2><p class="muted">Change requests submitted through the Aircraft Reference App · private admin view</p></div><div class="mc-actions"><button type="button" id="mcRefresh">↻ Refresh inbox</button></div></div>
<div class="mc-summary"><div class="mc-mini"><strong id="mcTotal">—</strong><span>TOTAL REQUESTS</span></div><div class="mc-mini"><strong id="mcNew">—</strong><span>NEW</span></div><div class="mc-mini"><strong id="mcProgress">—</strong><span>IN PROGRESS</span></div><div class="mc-mini"><strong id="mcDone">—</strong><span>COMPLETED</span></div></div>
<div class="mc-tools"><label for="mcFilter">Show requests</label><select id="mcFilter"><option value="all">All requests</option><option value="new">New</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="declined">Declined</option></select><span class="mc-state" id="mcState" role="status" aria-live="polite">Connect to load requests.</span></div><div class="mc-list" id="mcList"></div>`;
const mapSection=root.querySelector('#usageMap')?.closest('section');
if(mapSection)mapSection.before(section);else root.appendChild(section);
const $mc=id=>document.getElementById(id);
const statusNames={new:'New',in_progress:'In Progress',completed:'Completed',declined:'Declined'};
let records=[],loading=false;
const fmt=n=>(Number(n)||0).toLocaleString();
const dateText=x=>{const d=new Date(x);return Number.isNaN(d.valueOf())?String(x||''):d.toLocaleString('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})+' CT'};
function render(){
 const filtered=$mc('mcFilter').value==='all'?records:records.filter(r=>r.status===$mc('mcFilter').value);
 const dest=$mc('mcList');dest.replaceChildren();
 if(!filtered.length){const p=document.createElement('p');p.className='mc-state';p.textContent='No requests match this filter.';dest.append(p);return;}
 for(const record of filtered){
  const card=document.createElement('article');card.className='mc-item'+(record.status==='new'?' new':'');
  const top=document.createElement('div');top.className='mc-item-top';
  const title=document.createElement('div'),h=document.createElement('h3');h.textContent='#'+record.id+' · '+record.type+' · '+record.section;
  const meta=document.createElement('div');meta.className='mc-meta';meta.textContent='Received '+dateText(record.created_at)+(record.reply_to?' · Contact: '+record.reply_to:' · Anonymous');title.append(h,meta);
  const badge=document.createElement('span');badge.className='mc-status '+record.status;badge.textContent=statusNames[record.status]||record.status;top.append(title,badge);
  const body=document.createElement('p');body.className='mc-message';body.textContent=record.message;
  const actions=document.createElement('div');actions.className='mc-item-actions';
  const statusLabel=document.createElement('label');statusLabel.textContent='STATUS';const select=document.createElement('select');select.setAttribute('aria-label','Status for request '+record.id);
  for(const [value,label] of Object.entries(statusNames)){const opt=document.createElement('option');opt.value=value;opt.textContent=label;select.append(opt);}select.value=record.status;statusLabel.append(select);
  const noteLabel=document.createElement('label');noteLabel.textContent='PRIVATE ADMIN NOTE';const note=document.createElement('textarea');note.maxLength=2000;note.rows=2;note.placeholder='Optional follow-up or resolution note';note.value=record.admin_note||'';noteLabel.append(note);
  const save=document.createElement('button');save.type='button';save.className='primary';save.textContent='Save changes';const result=document.createElement('span');result.className='mc-state';result.setAttribute('role','status');
  save.onclick=async()=>{save.disabled=true;result.textContent='Saving…';try{
   const secret=typeof key==='string'?key:'';if(!secret)throw Error('Dashboard is locked');
   const resp=await fetch('https://aircraft-reference-usage.wgy9sy6b59.workers.dev/requests/'+encodeURIComponent(record.id),{method:'PATCH',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({status:select.value,admin_note:note.value}),cache:'no-store'});
   const obj=await resp.json().catch(()=>({}));if(!resp.ok||obj.ok!==true)throw Error(obj.error||'Unable to save changes');
   record.status=select.value;record.admin_note=note.value;result.textContent='Saved';await refreshInbox();
  }catch(e){result.textContent='Save failed: '+e.message;}finally{save.disabled=false;}};
  actions.append(statusLabel,noteLabel,save,result);card.append(top,body,actions);dest.append(card);
 }
}
async function refreshInbox(){
 if(loading||root.hidden)return;
 const secret=typeof key==='string'?key:'';if(!secret)return;
 loading=true;$mc('mcRefresh').disabled=true;$mc('mcState').textContent='Loading messages…';
 try{
  const resp=await fetch('https://aircraft-reference-usage.wgy9sy6b59.workers.dev/requests?limit=200',{headers:{Authorization:'Bearer '+secret},cache:'no-store'});
  const obj=await resp.json().catch(()=>({}));if(!resp.ok)throw Error(resp.status===404?'Worker message endpoint not installed':obj.error||'HTTP '+resp.status);
  if(!Array.isArray(obj.requests))throw Error('Unexpected inbox response');records=obj.requests;
  const counts=Object.fromEntries((obj.counts||[]).map(v=>[v.status,Number(v.count)||0]));const total=Object.values(counts).reduce((a,b)=>a+b,0),unread=Number(obj.unread)||0;
  $mc('mcTotal').textContent=fmt(total);$mc('mcNew').textContent=fmt(counts.new);$mc('mcProgress').textContent=fmt(counts.in_progress);$mc('mcDone').textContent=fmt(counts.completed);
  $mc('mcUnread').textContent=fmt(unread);$mc('mcUnread').hidden=unread===0;
  $mc('mcState').textContent=(total>200?'Showing most recent 200 of '+fmt(total):'Showing '+fmt(records.length)+' of '+fmt(total))+' requests · '+dateText(new Date().toISOString());render();
 }catch(e){$mc('mcState').textContent='Message Center unavailable: '+e.message+'. Check Worker deployment and D1 migration.';}
 finally{loading=false;$mc('mcRefresh').disabled=false;}
}
$mc('mcFilter').onchange=render;$mc('mcRefresh').onclick=refreshInbox;
let wasVisible=!root.hidden;
new MutationObserver(()=>{const visible=!root.hidden;if(visible&&!wasVisible)refreshInbox();wasVisible=visible;}).observe(root,{attributes:true,attributeFilter:['hidden']});
const normalRefresh=document.getElementById('refresh');if(normalRefresh)normalRefresh.addEventListener('click',()=>{setTimeout(refreshInbox,100);});
if(wasVisible)refreshInbox();
})();
