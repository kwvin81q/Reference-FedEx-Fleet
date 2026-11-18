/* FedEx MX shared vibration calculator access + usage telemetry v2.
   Use with the existing Cloudflare /calc-pin/check and /app-event routes.
   The PIN and aircraft readings are NEVER included in telemetry payloads.
   Runs before normal click handlers via capture; preserves calculator logic.
*/
(()=>{'use strict';
 const current=document.currentScript;
 const APP=(current?.dataset.mxApp||'vibe-unknown').toLowerCase();
 const BUTTONS=current?.dataset.mxButtons||'#calculate';
 const RESULTS=current?.dataset.mxResults||'#result';
 const END='https://aircraft-reference-usage.wgy9sy6b59.workers.dev';
 const HUB='https://kwvin81q.github.io/Reference-FedEx-Fleet/apps.html';
 const ID_KEY='acmx-reference-visitor-v1';
 const ID=()=>crypto.randomUUID?.()||'mx-'+Date.now()+'-'+Math.random().toString(36).slice(2);
 let visitor;try{visitor=localStorage.getItem(ID_KEY);if(!visitor||visitor.length<10){visitor=ID();localStorage.setItem(ID_KEY,visitor)}}catch{visitor=ID()}
 const send=(event,page)=>{
  if(!/^[a-z0-9_-]{2,48}$/.test(APP))return;
  const payload={event,app:APP,page,visitor,eventId:ID()};
  try{fetch(END+'/app-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),mode:'cors',keepalive:true}).catch(()=>{});}catch{}
 };
 const style=document.createElement('style');style.textContent=`
 #mxVibeAppLink{position:fixed;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:10000;padding:11px 13px;border:1px solid #d2a9ff;border-radius:12px;background:linear-gradient(135deg,#7839ed,#a855f7);box-shadow:0 8px 25px #0009;color:#fff!important;text-decoration:none;font:800 12px/1.3 system-ui,sans-serif}
 #mxPinShadeV2{position:fixed;z-index:2147483640;inset:0;background:#020714e9;display:grid;place-items:center;padding:16px}
 #mxPinDialogV2{box-sizing:border-box;width:min(420px,100%);border:2px solid #a56aff;border-radius:17px;background:#11213a;color:white;padding:20px;font:15px/1.5 system-ui,sans-serif;box-shadow:0 16px 45px #000e}
 #mxPinDialogV2 h2{margin:0 0 8px;font-size:21px}#mxPinDialogV2 p{color:#cbd8e6;margin:6px 0 12px}
 #mxPinInputV2{box-sizing:border-box;width:100%;background:#142c48;color:#fff;border:1px solid #91afd4;border-radius:9px;padding:12px;min-height:49px;font:20px system-ui;letter-spacing:3px}
 #mxPinDialogV2 .mxPinRow{display:flex;gap:8px;margin-top:12px}#mxPinDialogV2 button{flex:1;background:#713fce!important;border:1px solid #b28bff!important;border-radius:9px;color:#fff!important;padding:12px 8px;font:800 14px system-ui;min-height:46px}#mxPinDialogV2 button[type=button]{background:#2e455e!important;border-color:#718b9e!important}
 #mxPinStatusV2{min-height:22px;color:#ffd48c!important;font-size:13px!important}
 @media(max-width:420px){#mxVibeAppLink{font-size:11px;padding:9px 10px}}
 `;document.head.appendChild(style);
 let busy=false,bypass=false,submitBypass=false;
 function navigate(){
  if(!document.getElementById('mxVibeAppLink')){
   const link=document.createElement('a');link.id='mxVibeAppLink';link.href=HUB;link.textContent='OTHER MX APPS ↗';
   link.addEventListener('click',()=>send('action','other-mx-apps'));document.body.append(link);
  }
 }
 async function validate(pin){
  const response=await fetch(END+'/calc-pin/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin}),cache:'no-store'});
  if(!response.ok)throw new Error('PIN service unavailable');
  return response.json();
 }
 function askPin(){return new Promise(resolve=>{
  const shade=document.createElement('div');shade.id='mxPinShadeV2';
  shade.innerHTML=`<section id="mxPinDialogV2" role="dialog" aria-modal="true" aria-labelledby="mxPinTitleV2"><h2 id="mxPinTitleV2">Calculation Access PIN</h2><p>Enter the shared PIN managed in Fleet Usage to calculate.</p><form id="mxPinFormV2"><input id="mxPinInputV2" type="password" pattern="[0-9]{4,8}" maxlength="8" inputmode="numeric" autocomplete="off" required aria-label="Shared calculation PIN" placeholder="4–8 digits"><p id="mxPinStatusV2" role="status" aria-live="polite"></p><div class="mxPinRow"><button type="submit">Verify & Calculate</button><button type="button" id="mxPinCancelV2">Cancel</button></div></form></section>`;
  document.body.append(shade);const form=shade.querySelector('form'),input=shade.querySelector('input'),msg=shade.querySelector('#mxPinStatusV2'),submit=form.querySelector('[type=submit]');
  let ended=false;function done(ok){if(ended)return;ended=true;shade.remove();resolve(ok)}
  shade.querySelector('#mxPinCancelV2').addEventListener('click',()=>{send('action','pin-cancelled');done(false)});
  form.addEventListener('submit',async e=>{
   e.preventDefault();e.stopPropagation();const pin=input.value;
   if(!/^\d{4,8}$/.test(pin)){msg.textContent='Enter 4–8 digits.';return}
   submit.disabled=true;msg.textContent='Checking PIN…';
   try{const res=await validate(pin);if(res.ok===true){send('action','pin-accepted');done(true)}else{send('action','pin-rejected');msg.textContent=res.configured===false?'Set the PIN in Fleet Usage first.':'Incorrect PIN. Try again.';input.select()}}
   catch{send('error','pin-service-unavailable');msg.textContent='Cannot verify PIN. Calculation remains locked.'}
   finally{submit.disabled=false}
  });
  input.focus();
 })}
 function snapshot(){return [...document.querySelectorAll(RESULTS)].map(x=>x.innerHTML).join('|')}
 function watchResult(before){
  // Log changed output, never sending inputs, PINs, or output contents.
  setTimeout(()=>{if(before!==snapshot())send('action','result-updated')},150);
 }
 async function run(action,label){
  if(busy)return;busy=true;send('action','calculation-attempt');
  try{if(await askPin()){
    send('action','calculation-authorized');
    const before=snapshot();bypass=true;submitBypass=true;
    try{action();watchResult(before)}finally{bypass=false;submitBypass=false}
  }}finally{busy=false}
 }
 function initialize(){
  navigate();send('open','calculator');send('page','calculator');
  document.addEventListener('click',e=>{
   if(bypass||e.target.closest('#mxPinShadeV2'))return;
   let button;try{button=e.target.closest(BUTTONS)}catch{return}
   if(!button||button.disabled)return;
   e.preventDefault();e.stopImmediatePropagation();
   run(()=>button.click());
  },true);
  // Protect submissions from Enter key as well as tap/click.
  document.addEventListener('submit',e=>{
   if(submitBypass||e.target.id==='mxPinFormV2')return;
   const form=e.target;
   let button;try{button=form.querySelector(BUTTONS)}catch{return}
   if(!button)return;
   e.preventDefault();e.stopImmediatePropagation();
   run(()=>form.requestSubmit(button));
  },true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
