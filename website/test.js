
let currentRole='manager', delOffset=0, ruOffset=0, allDels=[], drivers=[], otpDelId=0, statusChart;
function checkOk(r){return r&&(r.success===1||r.success===true||String(r.success)==='1'||r.status==='success'||(r.data&&r.data.success===1));}
window.checkOk=checkOk;
function showToast(msg,type='success'){let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';c.style.cssText='position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';document.body.appendChild(c);}const t=document.createElement('div');const isErr=type==='error';t.style.cssText=`background:${isErr?'#FEF2F2':'#F0FDF4'};color:${isErr?'#DC2626':'#16A34A'};border:1px solid ${isErr?'#F87171':'#86EFAC'};padding:12px 20px;border-radius:8px;font-family:Inter,sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);opacity:0;transform:translateY(-20px);transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`;t.innerHTML=msg;c.appendChild(t);setTimeout(()=>{t.style.opacity='1';t.style.transform='translateY(0)';},10);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(-20px)';setTimeout(()=>t.remove(),300);},3000);}
window.showToast=showToast;

window.addEventListener('DOMContentLoaded',()=>{
  CdApi.requireLogin();
  const n=CdApi.userName(), role=CdApi.roleCode();
  document.getElementById('sbname').textContent=n;
  document.getElementById('sbav').textContent=n?n[0].toUpperCase():'D';
  document.getElementById('sbrole').textContent=role.replace(/_/g,' ');
  if(role==='delivery_boy'||role==='delivery_manager'&&false) setRole('rider',document.querySelector('.rt-btn:last-child'));
  statusChart=new Chart(document.getElementById('c-status'),{
    type:'doughnut',
    data:{labels:['Unassigned','In Transit','Delivered','Cancelled'],
      datasets:[{data:[0,0,0,0],backgroundColor:['#FCA5A5','#93C5FD','#86EFAC','#D1D5DB'],borderWidth:0}]},
    options:{cutout:'60%',plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:6}}}}
  });
  loadStats(); loadCurrentView();
  setInterval(() => {
    if (document.hidden) return;
    if (document.getElementById('view-otp-detail').style.display !== 'block') {
      if (currentRole === 'manager' && delOffset <= 15) { loadCurrent(); }
      else if (currentRole === 'rider' && ruOffset <= 10) { loadCurrent(); }
    }
  }, 15000);
});

function setRole(r,el){
  currentRole=r;
  document.querySelectorAll('.rt-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  loadCurrentView();
}

function showView(v){
  ['manager','rider-unassigned','rider-mine','otp-detail','driver-perf'].forEach(x=>
    document.getElementById('view-'+x).style.display='none');
  document.getElementById('view-'+v).style.display='block';
  document.getElementById('tb-title').textContent=
    {manager:'Delivery Management','rider-unassigned':'Available Deliveries',
     'rider-mine':'My Deliveries','otp-detail':'OTP Verification','driver-perf':'Driver Performance'}[v]||'Delivery';
}

function loadCurrent(){loadStats();loadCurrentView();}

function loadCurrentView(){
function ext(v){if(Array.isArray(v)){if(v.length===0)return'';let l=v[v.length-1];if(typeof l==='object'&&l!==null)return l.name||l.display_name||('ID: '+l.id)||'';return l;}return v||'';}
function extState(v){if(Array.isArray(v)){return{st:v[0]||'',l:v[1]||''};}return{st:v||'',l:v||''};}
window.ext=ext;window.extState=extState;
  if(currentRole==='manager'){showView('manager');loadManagerView();}
  else{showView('rider-unassigned');loadRiderUnassigned();}
}

async function loadStats(){
  try{
    const r=await CdApi.deliveryDashboard();
    if(r.error){document.getElementById('err').textContent='Stats: '+r.message;document.getElementById('err').style.display='block';return;}
    const s=r.stats||r||{};
    setText('st-total',  s.total_today    ||0);
    setText('st-unassign',s.unassigned    ||0);
    setText('st-transit', s.in_transit    ||0);
    setText('st-done',    s.delivered_today||0);
    setText('st-cancel',  s.cancelled_today||0);
    statusChart.data.datasets[0].data=[s.unassigned||0,s.in_transit||0,s.delivered_today||0,s.cancelled_today||0];
    statusChart.update();
  }catch(e){}
}

async function loadManagerView(){
  delOffset=0; allDels=[];
  await loadDeliveries('');
  await loadDrivers();
}

async function loadDeliveries(domain){
  try{
    const params={limit:15,offset:delOffset};
    if(domain) params.domain=domain;
    const r=await (domain?CdApi.allDeliveries(15,delOffset,domain):CdApi.allDeliveries(15,delOffset));
    const data=(r.results||r.data||[]);
    if(delOffset===0) allDels=data; else allDels=[...allDels,...data];
    setText('del-count',allDels.length+' deliveries'+(r.total?' of '+r.total:''));
    renderDelList(allDels);
    document.getElementById('del-more-btn').style.display=data.length===15?'block':'none';
    delOffset+=data.length;
    if(r.error){document.getElementById('err').textContent=r.message;document.getElementById('err').style.display='block';}
  }catch(e){}
}

function filterDel(domain,el){
  document.querySelectorAll('#view-manager .f-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active'); delOffset=0; allDels=[];
  loadDeliveries(domain.replace(/&quot;/g,'"'));
}
function loadMoreDels(){loadDeliveries('');}

function renderDelList(dels){
  const stateColor={done:'#16A34A',assigned:'#3B82F6',cancel:'#DC2626',confirmed:'#F59E0B'};
  const stateLabel={done:'Delivered',assigned:'Assigned',cancel:'Cancelled',confirmed:'Ready'};
  document.getElementById('del-list').innerHTML=dels.map(d=>{
    const {st, l:apiLabel}=window.extState(d.state);
    const cust=window.ext(d.partner_id)||'Customer';
    const driver=window.ext(d.user_id); const unassigned=!driver;
    const c=stateColor[st]||'#94A3B8'; const l=apiLabel||stateLabel[st]||st;
    return `<div class="del-row">
      <div class="del-av">${String(cust)[0]?.toUpperCase()||'C'}</div>
      <div style="flex:1">
        <div style="font-size:12px;color:var(--text-soft)">${d.name||''}</div>
        <div style="font-size:14px;font-weight:700">${cust}</div>
        <div style="font-size:11px;color:${unassigned?'#DC2626':'var(--text-mid)'}">
          ${unassigned?'&#x26A0;&#xFE0F; Unassigned':'&#x1F69A; '+driver}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <span class="pill" style="background:${c}22;color:${c}">${l}</span>
        ${unassigned?`<button onclick="openAssign(${d.id},'${d.name||''}')" style="background:var(--primary);color:#fff;border:none;border-radius:7px;padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer">Assign</button>`:''}
      </div>
    </div>`;
  }).join('')||'<div style="text-align:center;padding:20px;color:var(--text-mid)">No deliveries</div>';
}

async function loadDrivers(){
  try{
    const r=await CdApi.deliveryPersons();
    drivers=(r.results||r.data||[]);
    document.getElementById('driver-list').innerHTML=drivers.length?
      drivers.slice(0,6).map(d=>`<div class="del-row">
        <div class="del-av">${(d.name||'D')[0].toUpperCase()}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:600">${d.name||''}</div><div style="font-size:11px;color:var(--text-mid)">Delivery Boy · ID: ${d.id}</div></div>
        <span class="pill pill-green">Active</span>
      </div>`).join('')
      :'<div style="text-align:center;padding:16px;color:var(--text-mid)">No drivers</div>';
  }catch(e){}
}

// Assign modal
function openAssign(id, name){
  document.getElementById('assign-title').textContent='Assign '+name;
  document.getElementById('assign-sub').textContent='Select a delivery driver';
  document.getElementById('assign-drivers').innerHTML=drivers.map(d=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div class="del-av">${(d.name||'D')[0].toUpperCase()}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:600">${d.name||''}</div></div>
      <button onclick="doAssign(${id},${d.id},'${d.name||''}');closeAssign()" style="background:var(--primary);color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer">Assign</button>
    </div>`).join('');
  document.getElementById('assign-modal').style.display='flex';
}
function closeAssign(){document.getElementById('assign-modal').style.display='none';}

async function doAssign(delId,driverId,driverName){
  const r=await CdApi.assignDelivery(delId,driverId);
  if(window.checkOk(r)){showToast(`✅ Assigned to ${driverName}`);}else{showToast(r.message||'Error','error');}
  loadDeliveries('');
}

// Rider — Unassigned
let ruItems=[];
async function loadRiderUnassigned(){
  ruOffset=0;ruItems=[];
  try{
    const r=await CdApi.riderUnassigned(10,0);
    ruItems=(r.results||r.data||[]);
    renderRU(ruItems);
    document.getElementById('ru-more').style.display=ruItems.length===10?'block':'none';
    ruOffset=ruItems.length;
  }catch(e){}
}
async function loadMoreRU(){
  const r=await CdApi.riderUnassigned(10,ruOffset);
  const d=(r.results||r.data||[]);
  ruItems=[...ruItems,...d];
  renderRU(ruItems);
  ruOffset+=d.length;
  if(d.length<10)document.getElementById('ru-more').style.display='none';
}
function renderRU(items){
  document.getElementById('ru-list').innerHTML=items.map(d=>{
    const cust=window.ext(d.partner_id)||'Customer';
    return `<div class="del-row">
      <div class="del-av">${String(cust)[0]?.toUpperCase()||'C'}</div>
      <div style="flex:1"><div style="font-size:12px;color:var(--text-soft)">${d.name||''}</div><div style="font-size:14px;font-weight:700">${cust}</div></div>
      <button onclick="doAccept(${d.id})" style="background:var(--primary);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer">Accept</button>
    </div>`;
  }).join('')||'<div style="text-align:center;padding:20px;color:var(--text-mid)">&#x1F69A; No available deliveries</div>';
}
async function doAccept(id){
  const r=await CdApi.riderAccept(id,CdApi.userId());
  if(window.checkOk(r)){showToast('✅ Delivery accepted!');loadRiderUnassigned();}
  else{showToast(r.message||'Could not accept','error');}
}

async function loadRiderMine(){
  try{
    const r=await CdApi.riderMyDeliveries(CdApi.userId(),15,0);
    const d=(r.results||r.data||[]);
    document.getElementById('rm-list').innerHTML=d.map(x=>{
      const cust=window.ext(x.partner_id)||'Customer';
      const {st}=window.extState(x.state);
      const done=st==='done';
      return `<div class="del-row" style="cursor:${done?'default':'pointer'}" onclick="${done?'':'openOtp('+x.id+',\''+x.name+'\',\''+cust+'\')'}">
        <div class="del-av" style="background:${done?'#16A34A':'var(--primary)'}">${String(cust)[0]?.toUpperCase()||'C'}</div>
        <div style="flex:1"><div style="font-size:12px;color:var(--text-soft)">${x.name||''}</div><div style="font-size:14px;font-weight:700">${cust}</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="pill ${done?'pill-green':'pill-blue'}">${done?'Delivered':'Manage &#x3009;'}</span>
        </div>
      </div>`;
    }).join('')||'<div style="text-align:center;padding:20px;color:var(--text-mid)">No deliveries assigned yet</div>';
  }catch(e){}
}

// OTP Flow
let otpSent=false, otpVerified=false;
function openOtp(id,name,cust){
  otpDelId=id; otpSent=false; otpVerified=false;
  for(let i=0;i<6;i++){const el=document.getElementById('oi'+i);if(el)el.value='';}
  document.getElementById('otp-del-name').textContent=name;
  document.getElementById('otp-del-cust').textContent='Customer: '+cust;
  document.getElementById('otp-del-info').innerHTML=`
    <div style="font-size:13px;margin-bottom:8px"><b>Delivery ID:</b> ${id}</div>
    <div style="font-size:13px;margin-bottom:8px"><b>Customer:</b> ${cust}</div>
    <div style="font-size:13px"><b>Status:</b> Assigned</div>`;
  resetSteps();
  showView('otp-detail');
}
function resetSteps(){
  ['step1','step2','step3'].forEach((s,i)=>{
    document.getElementById(s).className='otp-step'+(i===0?' active':'');
    document.getElementById('sn'+(i+1)).className='step-num'+(i===0?' active-n':'');
  });
  show('btn-send'); hide('btn-resend'); hide('otp-inputs'); hide('btn-verify'); hide('btn-done');
}
function otpInp(i){
  const el=document.getElementById('oi'+i);
  if(el.value&&i<5) document.getElementById('oi'+(i+1))?.focus();
  const full=[0,1,2,3,4,5].map(j=>document.getElementById('oi'+j)?.value||'').join('');
  document.getElementById('btn-verify').style.display=full.length===6?'block':'none';
}
async function doSendOtp(){
  document.getElementById('btn-send').textContent='Sending...';
  const r=await CdApi.riderSendOtp(otpDelId);
  otpSent=true;
  document.getElementById('step1').className='otp-step done';
  document.getElementById('sn1').className='step-num done-n'; document.getElementById('sn1').textContent='✓';
  document.getElementById('step2').className='otp-step active';
  document.getElementById('sn2').className='step-num active-n';
  hide('btn-send'); show('btn-resend');
  show('otp-inputs'); document.getElementById('oi0').focus();
  showToast('📧 OTP sent to customer email');
}
async function doVerifyOtp(){
  const otp=[0,1,2,3,4,5].map(i=>document.getElementById('oi'+i)?.value||'').join('');
  document.getElementById('btn-verify').textContent='Verifying...';
  const r=await CdApi.riderVerifyOtp(otpDelId,otp);
  const ok=window.checkOk(r)||r.verified===true;
  if(ok){
    otpVerified=true;
    document.getElementById('step2').className='otp-step done';
    document.getElementById('sn2').className='step-num done-n'; document.getElementById('sn2').textContent='✓';
    document.getElementById('step3').className='otp-step active';
    document.getElementById('sn3').className='step-num active-n';
    show('btn-done');
    document.getElementById('otp-err').style.display='none';
  }else{
    document.getElementById('otp-err').textContent=r.message||'Invalid OTP. Try again.';
    document.getElementById('otp-err').style.display='block';
    document.getElementById('btn-verify').textContent='Verify OTP';
  }
}
async function doMarkDone(){
  document.getElementById('btn-done').textContent='Processing...';
  const r=await CdApi.riderMarkDone(otpDelId,CdApi.userId());
  const ok=window.checkOk(r)||r.state==='done';
  if(ok){showToast('🎉 Delivery marked as done!');showView('rider-mine');loadRiderMine();}
  else{showToast(r.message||'Error','error');document.getElementById('btn-done').textContent='Mark as Delivered ✅';}
}
async function doCustomerWait(){
  const r=await CdApi.riderCustomerWait(otpDelId,CdApi.userId(),'Customer not available');
  showToast(window.checkOk(r)||r.message?r.message||'Status updated':'Status updated', window.checkOk(r)?'success':'error');
}

async function loadDriverPerf(){
  try{
    const r=await CdApi.deliveryPersons();
    const drivers=(r.results||r.data||[]);
    document.getElementById('dp-body').innerHTML=drivers.length?
      drivers.map(d=>`<tr>
        <td style="font-weight:600">${d.name||''}</td>
        <td>—</td><td>—</td><td>—</td><td><span class="pill pill-green">Active</span></td>
      </tr>`).join('')
      :'<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-mid)">No drivers</td></tr>';
  }catch(e){}
}

function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function show(id){const e=document.getElementById(id);if(e)e.style.display='block';}
function hide(id){const e=document.getElementById(id);if(e)e.style.display='none';}

