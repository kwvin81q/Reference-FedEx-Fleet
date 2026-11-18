/* FedEx MX - shared PIN gate for vibration app Calculate Solution buttons.
 * Add <script src="https://kwvin81q.github.io/Reference-FedEx-Fleet/mx-calc-pin.js" defer></script>
 * before </body>. Mark the genuine Calculate button data-mx-calculate.
 * Not a certification/security control; mechanics still verify solutions against current AMM.
 */
(()=>{'use strict';
 const ENDPOINT='https://aircraft-reference-usage.wgy9sy6b59.workers.dev/calc-pin/check';
 const SELECTOR='[data-mx-calculate]';
 let unlockedPin='',busy=false,repeatElement=null;
 const sheet=document.createElement('style');sheet.textContent=`
 #mxPinShade{position:fixed;inset:0;z-index:2147483000;background:rgba(3,8,18,.83);display:flex;align-items:center;justify-content:center;padding:18px}
 #mxPinBox{width:min(400px,100%);background:#111d35;color:#f5f7ff;border:1px solid #9764f5;border-radius:18px;padding:22px;font-family:system-ui,sans-serif;box-shadow:0 12px 45px #000a}
 #mxPinBox h2{font-size:22px;margin:0 0 8px}#mxPinBox p{color:#b8c6e5;font-size:14px;line-height:1.5}
 #mxPinInput{width:100%;padding:13px 14px;box-sizing:border-box;font-size:22px;letter-spacing:6px;border-radius:10px;border:1px solid #7689a9;background:#192b4b;color:white}
 #mxPinBox .mx-row{display:flex;gap:10px;margin-top:15px}#mxPinBox button{padding:12px 16px;border:0;border-radius:10px;background:#824df0;color:white;font-weight:700;cursor:pointer}#mxPinBox button:last-child{background:#324561}
 #mxPinMessage{min-height:22px;color:#ffbd84!important}`;
 document.head.appendChild(sheet);
 function ask(){return new Promise(resolve=>{
   const modal=document.createElement('div');modal.id='mxPinShade';
   modal.innerHTML='<div id="mxPinBox" role="dialog" aria-modal="true" aria-label="Calculation PIN"><h2>Calculation Access PIN</h2><p>This app is available to everyone. Enter the PIN to calculate a solution.</p><form id="mxPinForm"><input id="mxPinInput" type="password" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" autocomplete="off" required placeholder="••••" aria-label="Calculation PIN"><p id="mxPinMessage" role="status"></p><div class="mx-row"><button id="mxPinConfirm" type="submit">Unlock Calculate</button><button type="button" id="mxPinCancel">Cancel</button></div></form></div>';
   document.body.appendChild(modal);let closed=false;
   function close(value){if(closed)return;closed=true;modal.remove();resolve(value)}
   modal.querySelector('#mxPinCancel').onclick=()=>close(null);
   const form=modal.querySelector('#mxPinForm');const input=modal.querySelector('#mxPinInput');const msg=modal.querySelector('#mxPinMessage');
   form.addEventListener('submit',async e=>{e.preventDefault();const pin=input.value;if(!/^\d{4,8}$/.test(pin)){msg.textContent='Use 4 to 8 digits.';return}
     const btn=modal.querySelector('#mxPinConfirm');btn.disabled=true;msg.textContent='Checking PIN…';
     try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin}),cache:'no-store'});const data=await r.json();
       if(!r.ok)throw Error(data.error||'Verification unavailable');
       if(data.ok)return close(pin);msg.textContent=data.configured===false?'PIN has not been set yet.':'Incorrect PIN. Try again.';input.select();
     }catch(err){msg.textContent=err.message||'Unable to verify PIN.'}finally{btn.disabled=false}
   });input.focus();
 })}
 async function validate(pin){try{const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin}),cache:'no-store'});const d=await res.json();return res.ok&&d.ok===true}catch{return false}}
 document.addEventListener('click',async function(e){
   const target=e.target.closest?.(SELECTOR);if(!target||target===repeatElement)return;
   e.preventDefault();e.stopImmediatePropagation();if(busy)return;busy=true;
   try{
     if(unlockedPin && !await validate(unlockedPin))unlockedPin='';
     if(!unlockedPin)unlockedPin=(await ask())||'';
     if(unlockedPin){repeatElement=target;target.click();repeatElement=null}
   }finally{repeatElement=null;busy=false}
 },true);
 // Form submission via Enter or programmatic requestSubmit should also require the PIN.
 document.addEventListener('submit',async function(e){
   const form=e.target;if(!form.querySelector(SELECTOR)||form===window.mxPinForm||form.dataset.mxPinAuthorized==='yes')return;
   e.preventDefault();e.stopImmediatePropagation();if(busy)return;busy=true;
   try{if(unlockedPin&&!await validate(unlockedPin))unlockedPin='';if(!unlockedPin)unlockedPin=(await ask())||'';
     if(unlockedPin){form.dataset.mxPinAuthorized='yes';form.requestSubmit();delete form.dataset.mxPinAuthorized}
   }finally{busy=false}
 },true);
})();
