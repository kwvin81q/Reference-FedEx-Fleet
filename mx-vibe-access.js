/* FedEx MX vibration-app shared calculation PIN and App Center navigation.
   Host at /Reference-FedEx-Fleet/mx-vibe-access.js. Existing Worker handles PIN checks.
   No vibration readings, phase, hole, weights or PIN values are sent to tracking.
*/
(()=>{'use strict';
 const script=document.currentScript;
 const app=(script?.dataset?.mxApp||'vibe-unknown').toLowerCase().replace(/[^a-z0-9_-]/g,'-').slice(0,48);
 const END='https://aircraft-reference-usage.wgy9sy6b59.workers.dev';
 const HUB='https://kwvin81q.github.io/Reference-FedEx-Fleet/apps.html';
 const PIN_ENDPOINT=END+'/calc-pin/check';
 let verifiedPin='';let pending=false;const allowed=new WeakSet();
 const rand=()=>globalThis.crypto?.randomUUID?.()||('mx-'+Date.now()+'-'+Math.random().toString(36).slice(2));
 let visitor;
 try{visitor=localStorage.getItem('acmx-reference-visitor-v1');if(!visitor){visitor=rand();localStorage.setItem('acmx-reference-visitor-v1',visitor)}}catch{visitor=rand()}
 const clean=s=>String(s||'').toLowerCase().replace(/[^a-z0-9_./:-]/g,'-').slice(0,85)||'home';
 function track(label){const value=clean(label);if(window.MXTrack?.send){window.MXTrack.send('action',value);return}
  const payload={event:'action',app,page:value,visitor,eventId:rand()};
  try{fetch(END+'/app-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{})}catch{}
 }
 const css=document.createElement('style');css.textContent=`
  #mxVibeAppLink{position:fixed;z-index:10020;right:12px;top:calc(10px + env(safe-area-inset-top));padding:10px 13px;background:linear-gradient(135deg,#7839ed,#a855f7);color:white!important;text-decoration:none;font:800 12px/1.3 system-ui,sans-serif;border:1px solid #d2a9ff;border-radius:12px;box-shadow:0 8px 25px #0009}
  #mxPinVeil{position:fixed;z-index:2147483000;inset:0;background:#020814de;display:grid;place-items:center;padding:16px}
  #mxPinDialog{box-sizing:border-box;width:min(420px,100%);background:#112039;color:#fff;border:2px solid #9a5dff;border-radius:17px;box-shadow:0 14px 42px #000c;padding:20px;font:15px/1.5 system-ui,sans-serif}
  #mxPinDialog h2{margin:0;font-size:21px}#mxPinDialog p{margin:8px 0 12px;color:#ccdaed}
  #mxPinEntry{box-sizing:border-box;width:100%;background:#132e48;border:1px solid #91aace;border-radius:9px;color:white;padding:12px;font:20px system-ui,sans-serif;letter-spacing:4px;min-height:46px}
  #mxPinMsg{min-height:21px;font-size:13px;color:#ffd28c}#mxPinActions{display:flex;gap:9px;flex-wrap:wrap}
  #mxPinActions button{min-height:44px;padding:11px 16px;border:1px solid #a882f7;border-radius:10px;background:#673dcc;color:white;font:800 14px system-ui,sans-serif;cursor:pointer}
  #mxPinActions button:last-child{background:#2b4159;border-color:#718398}
  @media(max-width:450px){#mxVibeAppLink{font-size:11px;padding:9px 10px}}`;
 (document.head||document.documentElement).append(css);
 function setupLink(){if(document.getElementById('mxVibeAppLink'))return;const a=document.createElement('a');a.id='mxVibeAppLink';a.href=HUB;a.textContent='OTHER MX APPS ↗';a.addEventListener('click',()=>track('other-mx-apps'));document.body.append(a)}
 async function check(pin){const r=await fetch(PIN_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin}),cache:'no-store'});const body=await r.json().catch(()=>({}));if(!r.ok)throw Error('PIN service unavailable');return body;}
 function askPin(){return new Promise(resolve=>{
  const veil=document.createElement('div');veil.id='mxPinVeil';veil.innerHTML=`<section id="mxPinDialog" role="dialog" aria-modal="true" aria-labelledby="mxPinTitle"><h2 id="mxPinTitle">Calculation Access PIN</h2><p>Enter the shared PIN set in Fleet Usage to calculate a solution.</p><form id="mxPinPrompt"><input id="mxPinEntry" type="password" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" autocomplete="off" required aria-label="Calculation PIN" placeholder="4–8 digits"><p id="mxPinMsg" role="status" aria-live="polite"></p><div id="mxPinActions"><button type="submit">Verify &amp; Calculate</button><button type="button" id="mxPinCancel">Cancel</button></div></form></section>`;
  document.body.append(veil);const input=veil.querySelector('#mxPinEntry'),form=veil.querySelector('#mxPinPrompt'),msg=veil.querySelector('#mxPinMsg'),submit=form.querySelector('[type=submit]');
  let settled=false;function end(pin){if(settled)return;settled=true;veil.remove();resolve(pin)}
  veil.querySelector('#mxPinCancel').addEventListener('click',()=>{track('pin-cancelled');end(null)});
  form.addEventListener('submit',async e=>{e.preventDefault();const pin=input.value;if(!/^\d{4,8}$/.test(pin)){msg.textContent='Enter a 4–8 digit PIN.';return}submit.disabled=true;msg.textContent='Verifying…';try{const result=await check(pin);if(result.ok===true){track('pin-accepted');end(pin)}else{track('pin-rejected');msg.textContent=result.configured===false?'Set a PIN in Fleet Usage first.':'Incorrect PIN. Try again.';input.select()}}catch{track('pin-service-error');msg.textContent='Unable to reach the PIN service. Calculation remains locked.'}finally{submit.disabled=false}});
  input.focus();
 })}
 async function unlock(){if(verifiedPin){try{const result=await check(verifiedPin);if(result.ok)return true;verifiedPin=''}catch{track('pin-service-error');return false}}
  const entered=await askPin();if(!entered)return false;verifiedPin=entered;return true;
 }
 function attach(){setupLink();const form=document.querySelector('#form');if(!form){console.warn('MX calculation PIN: form not found');return}
  const button=form.querySelector('[data-mx-calculate],#calculate');if(!button){console.warn('MX calculation PIN: calculate button not found');return}
  // Capture form submissions BEFORE existing calculator handlers. Permit exactly one replay.
  form.addEventListener('submit',async e=>{
   if(allowed.has(form)){allowed.delete(form);return}
   e.preventDefault();e.stopImmediatePropagation();if(pending)return;
   pending=true;track('calculation-attempt');
   try{if(await unlock()){
     track('calculation-authorized');
     allowed.add(form);try{form.requestSubmit(button)}finally{allowed.delete(form)}
   }}finally{pending=false}
  },true);
  // Monitor the app's own results visibility; do not read results or input values.
  const results=document.getElementById('results');if(results){let previous=!results.hidden;
   new MutationObserver(()=>{const shown=!results.hidden;if(shown&&!previous)track('solution-displayed');previous=shown}).observe(results,{attributes:true,attributeFilter:['hidden']});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();
