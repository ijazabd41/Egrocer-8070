/* Coop Discounts App v6 — Session, Cart, OTP, Images all fixed */

/* ── PROGRESS BAR ─────────────────────────────────────── */
const Bar={_el:null,_v:0,_t:null,init(){if(this._el)return;this._el=document.createElement('div');this._el.style.cssText='position:fixed;top:0;left:0;height:3px;background:#ED1C24;z-index:99999;width:0;transition:width .25s;pointer-events:none';document.body.prepend(this._el);},start(){this.init();this._v=0;this._el.style.opacity='1';this._set(10);clearInterval(this._t);this._t=setInterval(()=>{if(this._v<85){this._v+=Math.random()*5;this._set(this._v);}},400);},done(){clearInterval(this._t);this._set(100);setTimeout(()=>{this._el.style.opacity='0';setTimeout(()=>{this._el.style.width='0';this._el.style.opacity='1';},400);},250);},_set(v){this._v=v;if(this._el)this._el.style.width=v+'%';}};

/* ── SKELETONS ────────────────────────────────────────── */
function skelRow(n=6,h=190){return Array(n).fill(0).map(()=>`<div style="min-width:140px;height:${h}px;border-radius:12px;flex-shrink:0" class="skel"></div>`).join('');}
function skelGrid(n=8,h=290){return Array(n).fill(0).map(()=>`<div style="height:${h}px" class="skel"></div>`).join('');}
function skelCats(n=8){return Array(n).fill(0).map(()=>`<div style="min-width:88px;height:112px;border-radius:18px;flex-shrink:0" class="skel"></div>`).join('');}

/* ── CART ─────────────────────────────────────────────── */
const Cart=(()=>{
  const CK='cd_cart',OK='cd_oid',PK='cd_placed_oid',PLK='cd_placed_oids';
  const L=()=>(typeof API!=='undefined'&&API.log)?API.log:{debug(){},info(){},warn(){},error(){}};
  const raw=()=>{try{return JSON.parse(localStorage.getItem(CK)||'[]');}catch(_){return[];}};
  const sv=a=>{try{localStorage.setItem(CK,JSON.stringify(a));}catch(_){}};
  const oid=()=>localStorage.getItem(OK);
  const soid=id=>localStorage.setItem(OK,String(id));
  const coid=()=>localStorage.removeItem(OK);
  const wasPlaced=id=>{
    const s=String(id);
    try{
      const list=JSON.parse(localStorage.getItem(PLK)||'[]');
      if(list.some(x=>String(x)===s)) return true;
    }catch(_){}
    try{return sessionStorage.getItem(PK)===s;}catch(_){return false;}
  };
  const markPlaced=id=>{
    const s=String(id);
    try{sessionStorage.setItem(PK,s);}catch(_){}
    try{
      const list=JSON.parse(localStorage.getItem(PLK)||'[]');
      if(!list.some(x=>String(x)===s)){
        list.push(s);
        if(list.length>30) list.splice(0,list.length-30);
        localStorage.setItem(PLK,JSON.stringify(list));
      }
    }catch(_){}
  };
  const count=()=>raw().reduce((s,i)=>s+i.qty,0);
  const total=()=>raw().reduce((s,i)=>s+(i.price*i.qty),0);

  // ── Mutex lock to prevent duplicate order creation from rapid clicks ──
  let _ensureOrderLock = null;
  let _reusableOid = null;

  async function _ensureOrderImpl(){
    let id=oid();
    L().debug('Cart','ensureOrder → start',{storedOid:id});
    if(id){
      if(wasPlaced(id)){
        L().info('Cart','ensureOrder discard placed',{orderId:id});
        coid(); clearLineIds(); id=null;
        _reusableOid = null;
      }
      else{
        try{
          if(_reusableOid === id) return parseInt(id);
          const reusable=await API.isOrderReusable(parseInt(id));
          if(reusable){
            _reusableOid = id;
            L().info('Cart','ensureOrder reuse draft',{orderId:id});
            return parseInt(id);
          }
          L().info('Cart','ensureOrder discard unusable',{orderId:id});
          coid();
          clearLineIds();
          id=null;
        }catch(e){
          L().warn('Cart','ensureOrder check failed, keeping oid',{orderId:id,message:e.message});
          return parseInt(id);
        }
      }
    }
    if(id) return parseInt(id);
    if(!API.loggedIn()){
      L().debug('Cart','ensureOrder skipped (not logged in)');
      return null;
    }
    try{
      const r=await API.createOrder();
      if(r?.id){soid(r.id);L().info('Cart','ensureOrder created',{orderId:r.id,name:r.name});return r.id;}
    }catch(e){L().error('Cart','ensureOrder create failed',{message:e.message});}
    return null;
  }

  function ensureOrder(){
    // Serialize concurrent calls so only one order is ever created at a time.
    if(!_ensureOrderLock) _ensureOrderLock = _ensureOrderImpl().finally(()=>{ _ensureOrderLock=null; });
    return _ensureOrderLock;
  }

  /** Push local cart lines onto the Odoo quotation (required before loyalty / checkout). */
  async function syncToOrder(orderId, replace=false){
    const oid=parseInt(orderId,10);
    if(!oid) throw new Error('No order to update');
    const items=raw();
    L().info('Cart','syncToOrder → start',{orderId:oid,itemCount:items.length,replace});
    if(!items.length) throw new Error('Add products to your cart before applying a loyalty code');
    if(!API.loggedIn()) throw new Error('Please sign in first');

    try {
      const lr = await API.getLines(oid);
      const remoteLines = lr.data || [];
      let perfectMatch = true;
      if (replace && remoteLines.length !== items.length) {
        perfectMatch = false;
      } else {
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const vid = it.variant_id || it.product_id;
          const qty = Math.max(1, it.qty || 1);
          const rl = remoteLines.find(l => String(API.lineVariantId(l)) === String(vid));
          if (!rl || (rl.product_uom_qty || rl.qty) !== qty) {
            perfectMatch = false; break;
          }
        }
      }
      if (perfectMatch) {
         L().info('Cart', 'syncToOrder perfectly matched. Skipping sequence.');
         return oid;
      }
    } catch(e) { L().warn('Cart', 'syncToOrder fast match failed', { message: e.message }); }

    let changed=false;
    let lastErr=null;
    for(let i=0;i<items.length;i++){
      const it=items[i];
      const vid=it.variant_id||it.product_id;
      if(!vid) continue;
      const qty=Math.max(1, it.qty||1);
      try{
        const rl=await API.upsertOrderLine(oid, vid, qty);
        if(rl.rec_id && rl.rec_id!==it.line_id){ it.line_id=rl.rec_id; changed=true; }
      }catch(e){
        L().warn('Cart','syncToOrder line failed',{orderId:oid,variantId:vid,qty,message:e.message});
        lastErr=e;
      }
    }
    if(changed) sv(items);
    if(replace){
      const cartVids=new Set(items.map(it=>String(it.variant_id||it.product_id)).filter(Boolean));
      try{
        const lr=await API.getLines(oid);
        const extra=(lr.data||[]).filter(l=>{
          const vid=String(API.lineVariantId(l)||'');
          return vid && !cartVids.has(vid);
        }).map(l=>l.id);
        if(extra.length){
          L().info('Cart','syncToOrder removing extra lines',{orderId:oid,lineIds:extra});
          await API.rmLines(oid,extra);
        }
      }catch(e){ L().warn('Cart','syncToOrder replace failed',{orderId:oid,message:e.message}); }
    }
    if(lastErr){
      try{
        if(await API.orderLinesMatchCart(oid, items)){
          L().info('Cart','syncToOrder ✓ (lines matched despite errors)',{orderId:oid});
          return oid;
        }
      }catch(_){}
      L().error('Cart','syncToOrder ✗',{orderId:oid,message:lastErr.message});
      throw new Error('Could not add cart items to your order. '+(lastErr.message||''));
    }
    L().info('Cart','syncToOrder ✓',{orderId:oid,itemCount:items.length});
    return oid;
  }
  function clearLineIds(){
    const items=raw();
    if(!items.some(i=>i.line_id)) return;
    L().debug('Cart','clearLineIds',{count:items.filter(i=>i.line_id).length});
    items.forEach(i=>{ delete i.line_id; });
    sv(items);
  }
  async function add(prod){
    if(prod.qty_available===0){toast('❌ Out of stock','err');return;}
    const items=raw();const ex=items.find(i=>i.product_id===prod.product_id);
    if(ex){
      ex.qty++;sv(items);
      L().info('Cart','add qty+1',{product_id:prod.product_id,variant_id:ex.variant_id||ex.product_id,qty:ex.qty});
      const ordId=await ensureOrder();
      const vid=ex.variant_id||ex.product_id;
      if(ordId&&vid){
        try{
          const r=await API.updateCartQty(parseInt(ordId),vid,ex.qty);
          if(r.recId){ex.line_id=r.recId;sv(items);}
        }catch(e){
          L().warn('Cart','add update failed, retry create',{orderId:ordId,variantId:vid,message:e.message});
          delete ex.line_id;sv(items);
          try{
            const r=await API.addLine(parseInt(ordId),vid,ex.qty);
            if(r.data?.rec_id){ex.line_id=r.data.rec_id;sv(items);}
          }catch(e2){L().error('Cart','add retry failed',{orderId:ordId,variantId:vid,message:e2.message});}
        }
      }
    }else{
      L().info('Cart','add new item',{product_id:prod.product_id,variant_id:prod.variant_id||prod.product_id,name:prod.name});
      let lineId=null;const ordId=await ensureOrder();
      const vid=prod.variant_id||prod.product_id;
      if(ordId&&vid){
        try{const r=await API.addLine(parseInt(ordId),vid,1);lineId=r.data?.rec_id||null;}catch(e){L().error('Cart','add line failed',{orderId:ordId,variantId:vid,message:e.message});}
      }
      if(ordId&&lineId){
        try{const qr=await API.getLineQty(lineId);const bq=qr.data?.product_uom_qty||qr.data?.qty||1;if(bq!==1){const ix=items.findIndex(i=>i.product_id===prod.product_id);if(ix>-1){items[ix].qty=bq;sv(items);}}}catch(_){}
      }
      items.push({...prod,qty:1,line_id:lineId});sv(items);
      L().info('Cart','add ✓',{orderId:ordId,lineId,cartCount:count()});
    }
    tick();renderDrawer();toast('✅ Added to cart');
  }
  function remove(pid){
    const items=raw(),item=items.find(i=>i.product_id===pid);
    L().info('Cart','remove',{product_id:pid,variant_id:item?.variant_id||item?.product_id});
    const next=items.filter(i=>i.product_id!==pid);
    sv(next);
    const o=oid();
    const vid=item?.variant_id||item?.product_id;
    if(o&&vid){
      API.updateCartQty(parseInt(o),vid,0).catch(()=>{
        if(item?.line_id) API.rmLines(parseInt(o),[item.line_id]).catch(()=>{});
      });
    }
    if(!next.length){ coid(); L().debug('Cart','cart empty — cleared oid'); }
    tick();renderDrawer();
  }
  async function setQty(pid,delta){
    const items=raw(),item=items.find(i=>i.product_id===pid);if(!item)return;
    item.qty=Math.max(0,item.qty+delta);
    if(item.qty===0){remove(pid);return;}
    sv(items);
    const ordId2=oid();
    if(ordId2&&item.variant_id){
      try{
        const r=await API.updateCartQty(parseInt(ordId2),item.variant_id||item.product_id,item.qty);
        if(r.recId){item.line_id=r.recId;sv(items);}
      }catch(e){
        delete item.line_id;sv(items);
        L().warn('Cart','setQty sync failed',{product_id:pid,qty:item.qty,message:e.message});
      }
    }
    tick();renderDrawer();
  }
  function clear(){L().info('Cart','clear');localStorage.removeItem(CK);coid();tick();renderDrawer();}
  return{raw,sv,oid,soid,coid,wasPlaced,markPlaced,clearLineIds,count,total,add,remove,setQty,clear,ensureOrder,syncToOrder};
})();

/* ── TICK: Update ALL cart badges ─────────────────────── */
function tick(){
  const c=Cart.count();
  // Desktop badge in header
  document.querySelectorAll('.cart-badge').forEach(el=>{
    if(el.textContent!==String(c)) el.textContent=c;
    const shown=el.classList.contains('show');
    if(c>0&&!shown)el.classList.add('show');
    if(c===0&&shown)el.classList.remove('show');
  });
  // Mobile bottom nav badge
  document.querySelectorAll('.mna-badge').forEach(el=>{
    if(el.textContent!==String(c)) el.textContent=c;
    const shown=el.classList.contains('show');
    if(c>0&&!shown)el.classList.add('show');
    if(c===0&&shown)el.classList.remove('show');
  });

  // Dynamic Quantity Controls on product cards
  document.querySelectorAll('.cd-qty-ctrl').forEach(el => {
    const pid = parseInt(el.getAttribute('data-pid'), 10);
    const pdEnc = el.getAttribute('data-pdenc') || '';
    // Deal cards are populated asynchronously — don't replace until ready.
    if (!pdEnc) return;
    const btnCls = el.getAttribute('data-btnclass') || 'pc-atc';
    const item = Cart.raw().find(i => i.product_id === pid);
    const qty = item ? item.qty : 0;
    if (qty > 0) {
      el.innerHTML = dealQtyHtml(pid, qty);
    } else if (btnCls === 'dp-atc') {
      renderDealQtyCtrl(el, pid, pdEnc, btnCls);
    } else {
      el.innerHTML = `<button class="${btnCls}" onclick="event.preventDefault();event.stopPropagation();addToCart(decodeURIComponent('${pdEnc}'))">🛒 Add to Cart</button>`;
    }
  });
}

/* ── CART DRAWER ──────────────────────────────────────── */
function openDrw(){document.getElementById('cDrw')?.classList.add('open');document.getElementById('cOv').style.display='block';renderDrawer();}
function closeDrw(){document.getElementById('cDrw')?.classList.remove('open');document.getElementById('cOv').style.display='none';}

function renderDrawer(){
  const body=document.getElementById('cDrwBody'),ftr=document.getElementById('cDrwFtr');
  if(!body)return;
  const items=Cart.raw();
  if(!items.length){
    body.innerHTML=`<div style="text-align:center;padding:52px 20px"><div style="font-size:60px;margin-bottom:14px">🛒</div><h3 style="font-size:15px;font-weight:800;color:#374151;margin-bottom:8px">Your cart is empty</h3><a href="shop.html" onclick="closeDrw()" style="color:#ED1C24;font-weight:700;font-size:13px">Start Shopping →</a></div>`;
    if(ftr)ftr.innerHTML='';return;
  }
  body.innerHTML=items.map(it=>`
    <div style="display:flex;gap:11px;padding:12px 0;border-bottom:1px solid #f3f4f6;align-items:center">
      <div style="width:54px;height:54px;background:#f9fafb;border-radius:10px;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;border:1px solid #e5e7eb">
        ${it.image?`<img src="${it.image}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><span style="font-size:22px;display:none;align-items:center;justify-content:center;width:100%;height:100%">📦</span>`:'<span style="font-size:22px">📦</span>'}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#111">${it.name}</div>
        <div style="font-size:14px;font-weight:800;color:#a01820;margin:3px 0">AED ${(it.price||0).toFixed(2)}</div>
        <div style="display:flex;border:1.5px solid #ED1C24;border-radius:8px;overflow:hidden;width:86px;margin-top:5px">
          <button onclick="Cart.setQty(${it.product_id},-1)" style="width:28px;height:26px;background:#fef2f2;color:#a01820;font-size:15px;font-weight:700;border:none;cursor:pointer">−</button>
          <span style="flex:1;text-align:center;font-size:12px;font-weight:700;line-height:26px;color:#a01820">${it.qty}</span>
          <button onclick="Cart.setQty(${it.product_id},1)" style="width:28px;height:26px;background:#fef2f2;color:#a01820;font-size:15px;font-weight:700;border:none;cursor:pointer">+</button>
        </div>
      </div>
      <button onclick="Cart.remove(${it.product_id})" style="color:#ED1C24;font-size:17px;background:none;border:none;cursor:pointer;padding:4px;flex-shrink:0">🗑️</button>
    </div>`).join('');
  const t=Cart.total();
  if(ftr)ftr.innerHTML=`
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;margin-bottom:12px"><span>Total</span><span style="color:#a01820">AED ${t.toFixed(2)}</span></div>
    <a href="cart.html" onclick="closeDrw()" style="display:block;text-align:center;background:#f3f4f6;color:#374151;padding:10px;border-radius:8px;font-weight:700;font-size:13px;margin-bottom:8px;text-decoration:none">View Cart</a>
    <a href="javascript:void(0)" onclick="if(Cart.count()===0){ toast('Your cart is empty', 'warn'); return; } closeDrw(); location.href='checkout.html';" style="display:block;text-align:center;background:#ED1C24;color:#fff;padding:12px;border-radius:8px;font-weight:800;font-size:14px;text-decoration:none">Checkout →</a>`;
}

/* ── TOAST ────────────────────────────────────────────── */
let _tt;
function toast(msg,type='ok'){
  let el=document.getElementById('cd-toast');
  if(!el){el=document.createElement('div');el.id='cd-toast';el.style.cssText='position:fixed;bottom:72px;right:16px;padding:12px 18px;border-radius:12px;font-size:12px;font-weight:600;z-index:99998;box-shadow:0 8px 32px rgba(0,0,0,.18);transition:all .3s;transform:translateY(80px);opacity:0;max-width:280px;pointer-events:none;font-family:Inter,"Tajawal",sans-serif';document.body.appendChild(el);}
  el.style.background=type==='err'?'#ED1C24':type==='warn'?'#d4a800':'#1c1c2e';
  el.style.color='#fff';el.textContent=msg;
  requestAnimationFrame(()=>{el.style.transform='translateY(0)';el.style.opacity='1';});
  clearTimeout(_tt);_tt=setTimeout(()=>{el.style.transform='translateY(80px)';el.style.opacity='0';},3200);
}

function openModal(id){document.getElementById(id)?.classList.add('open');}
function closeModal(id){document.getElementById(id)?.classList.remove('open');}

/* ── PRODUCT CARD — correct image handling ────────────── */
function buildCard(p){
  if(!p?.id)return'';
  const id=p.id;
  const name=(p.name||p.display_name||'').replace(/^\[.*?\]\s*/,'').trim()||'Product';
  const price=parseFloat(p.list_price||p.lst_price||0);
  const std=parseFloat(p.standard_price||0);
  // CRITICAL: image_1024 is a PATH like /web/image/product.template/123/image_1024
  // Must prepend /proxy to load it
  const imgSrc=p.image_1024?API.img(p.image_1024):API.prodImg(id);
  const varId=Array.isArray(p.product_variant_id)&&p.product_variant_id.length?p.product_variant_id[0].id:id;
  const qtyAvail=p.qty_available!==undefined?parseFloat(p.qty_available):-1;
  const oos=qtyAvail===0;
  const ribbon=Array.isArray(p.website_ribbon_id)&&p.website_ribbon_id.length?p.website_ribbon_id[0]?.name:null;
  const disc=std>price&&std>0?Math.round((1-price/std)*100):0;
  const pdEnc=encodeURIComponent(JSON.stringify({product_id:id,variant_id:varId,name,price,image:imgSrc,qty_available:qtyAvail}));
  return `<div class="pc">
    <div class="pc-img">
      ${ribbon?`<span class="ribbon">${ribbon}</span>`:''}
      ${oos?`<span class="oos-tag">Out of Stock</span>`:''}
      <a href="product.html?id=${id}" style="display:block;width:100%;height:100%;position:relative">
        <img src="${imgSrc}" alt="${name.replace(/"/g,'&quot;')}" loading="lazy"
          style="width:100%;height:100%;object-fit:contain;display:block"
          onerror="this.style.display='none';this.nextSibling.style.display='flex'">
        <span style="font-size:44px;display:none;align-items:center;justify-content:center;width:100%;height:100%;position:absolute;top:0;left:0">📦</span>
      </a>
      ${oos?'':`<button class="wish-btn" onclick="WL.toggle(${id},'${name.replace(/'/g,"\\'")}')">♡</button>`}
    </div>
    <div class="pc-body">
      <a href="product.html?id=${id}" class="pc-nm">${name}</a>
      ${p.barcode?`<div class="pc-bc">${p.barcode}</div>`:''}
      <div class="pc-prices">
        <span class="pc-price">AED ${price.toFixed(2)}</span>
        ${disc>0?`<span class="pc-was">AED ${std.toFixed(2)}</span><span class="pc-save">-${disc}%</span>`:''}
      </div>
      ${oos?`<button class="pc-atc" disabled>Out of Stock</button>`:
        `<div class="cd-qty-ctrl" data-pid="${id}" data-pdenc="${pdEnc}" data-btnclass="pc-atc" style="margin-top:auto">
           ${Cart.raw().find(i=>i.product_id===id)?.qty > 0 
             ? `<div style="display:flex;border:1.5px solid var(--red);border-radius:8px;overflow:hidden;width:100%;height:38px">
                  <button onclick="event.preventDefault();event.stopPropagation();Cart.setQty(${id},-1)" style="width:34px;background:#fef2f2;color:var(--red);font-size:18px;font-weight:700;border:none;cursor:pointer">−</button>
                  <span style="flex:1;text-align:center;font-size:14px;font-weight:800;line-height:35px;color:var(--red)">${Cart.raw().find(i=>i.product_id===id).qty}</span>
                  <button onclick="event.preventDefault();event.stopPropagation();Cart.setQty(${id},1)" style="width:34px;background:#fef2f2;color:var(--red);font-size:18px;font-weight:700;border:none;cursor:pointer">+</button>
                </div>`
             : `<button class="pc-atc" onclick="event.preventDefault();event.stopPropagation();addToCart(decodeURIComponent('${pdEnc}'))">🛒 Add to Cart</button>`}
         </div>`}
    </div>
  </div>`;
}

function variantIdFromProduct(p, templateId) {
  if (!p) return templateId;
  const pv = p.product_variant_id;
  if (Array.isArray(pv) && pv.length) {
    const first = pv[0];
    return typeof first === 'object' ? (first.id ?? templateId) : first;
  }
  return templateId;
}

function mapProductsById(rows) {
  const map = {};
  (rows || []).forEach(p => {
    if (!p?.id) return;
    map[p.id] = p;
    map[String(p.id)] = p;
  });
  return map;
}

function sliderTemplateId(item) {
  const ref = item?.product_id;
  if (!ref) return null;
  if (Array.isArray(ref) && ref.length) {
    const first = ref[0];
    if (first && typeof first === 'object') return parseInt(first.id, 10) || null;
    if (typeof first === 'number') return first;
  }
  if (typeof ref === 'object' && ref.id) return parseInt(ref.id, 10) || null;
  if (typeof ref === 'number') return ref;
  return null;
}

function sliderDisplayName(item) {
  return (item?.name || item?.display_name || '')
    .replace(/^\[.*?\]\s*/, '')
    .replace(/^"+|"+$/g, '')
    .trim();
}

async function fetchProductsByIds(pids) {
  const unique = [...new Set(pids.filter(Boolean).map(id => parseInt(id, 10)))];
  if (!unique.length) return {};
  const map = {};
  await Promise.all(unique.map(async id => {
    try {
      const r = await API.getProdById(id);
      const p = Array.isArray(r.data) ? r.data[0] : r.data;
      if (p?.id) {
        map[p.id] = p;
        map[String(p.id)] = p;
      }
    } catch (_) {}
  }));
  const missing = unique.filter(id => !map[id] && !map[String(id)]);
  if (missing.length) {
    try {
      const domain = "[('id', 'in', [" + missing.join(',') + "])]";
      const r = await API.getProds({ domain, limit: Math.max(missing.length, 20) });
      Object.assign(map, mapProductsById(r.data || []));
    } catch (e) {
      console.warn('Bulk product fetch failed', e);
    }
  }
  return map;
}

async function resolveProductFromSliderItem(item, prodsMap = {}) {
  const pid = sliderTemplateId(item);
  if (pid) {
    let p = prodsMap[pid] || prodsMap[String(pid)];
    if (p) return p;
    try {
      const r = await API.getProdById(pid);
      p = Array.isArray(r.data) ? r.data[0] : r.data;
      if (p?.id) return p;
    } catch (_) {}
  }
  const name = sliderDisplayName(item);
  if (name.length >= 4) {
    try {
      const r = await API.searchProds(name.substring(0, 48));
      const list = r.data || [];
      const key = name.toLowerCase();
      const exact = list.find(p => (p.name || '').replace(/^\[.*?\]\s*/, '').trim().toLowerCase() === key);
      if (exact) return exact;
      if (list.length === 1) return list[0];
    } catch (_) {}
  }
  return null;
}

async function resolveProductForCart(templateId) {
  const id = parseInt(templateId, 10);
  if (!id) return null;
  const map = await fetchProductsById(id);
  return map[id] || map[String(id)] || null;
}

async function fetchProductsById(id) {
  return fetchProductsByIds([id]);
}

function cartPayloadFromProduct(p) {
  const pid = p.id;
  const price = parseFloat(p.list_price || p.lst_price || 0);
  const qty = p.qty_available !== undefined ? parseFloat(p.qty_available) : -1;
  const name = (p.name || p.display_name || 'Product').replace(/^\[.*?\]\s*/, '').trim();
  const image = p.image_1024 ? API.img(p.image_1024) : API.prodImg(pid);
  return {
    product_id: pid,
    variant_id: variantIdFromProduct(p, pid),
    name,
    price,
    image,
    qty_available: qty
  };
}

async function addToCart(json) {
  let payload;
  try { payload = typeof json === 'string' ? JSON.parse(json) : json; }
  catch (_) { toast('Could not add to cart', 'err'); return; }
  if (!payload?.product_id) { toast('Could not add to cart', 'err'); return; }

  if (!API.loggedIn()) {
    localStorage.setItem('pending_cart_add', JSON.stringify(payload));
    toast('Please sign in to add to cart', 'warn');
    setTimeout(() => { location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html'); }, 800);
    return;
  }

  try {
    const p = await resolveProductForCart(payload.product_id);
    if (!p) {
      toast('This product is no longer available', 'err');
      return;
    }
    const resolved = cartPayloadFromProduct(p);
    if (resolved.qty_available === 0) {
      toast('Out of stock', 'warn');
      return;
    }
    await Cart.add(resolved);
    openDrw();
  } catch (e) {
    toast(e?.message || 'Could not add to cart', 'err');
  }
}

function dealQtyHtml(pid, qty) {
  return `<div style="display:flex;border:1.5px solid var(--red);border-radius:8px;overflow:hidden;width:100%;height:38px">
     <button type="button" onclick="event.preventDefault();event.stopPropagation();Cart.setQty(${pid},-1)" style="width:34px;background:#fef2f2;color:var(--red);font-size:18px;font-weight:700;border:none;cursor:pointer">−</button>
     <span style="flex:1;text-align:center;font-size:14px;font-weight:800;line-height:35px;color:var(--red)">${qty}</span>
     <button type="button" onclick="event.preventDefault();event.stopPropagation();Cart.setQty(${pid},1)" style="width:34px;background:#fef2f2;color:var(--red);font-size:18px;font-weight:700;border:none;cursor:pointer">+</button>
   </div>`;
}

function renderDealQtyCtrl(wrap, pid, pdEnc, btnCls) {
  if (!wrap) return;
  const item = Cart.raw().find(i => i.product_id === pid);
  const qty = item ? item.qty : 0;
  if (qty > 0) {
    wrap.innerHTML = dealQtyHtml(pid, qty);
    return;
  }
  wrap.innerHTML = `<button type="button" class="${btnCls}" onclick="event.preventDefault();event.stopPropagation();addToCart(decodeURIComponent('${pdEnc}'))">🛒 Add to Cart</button>`;
}

/* ── DEAL CARDS — slider image_ids[] ─────────────────── */
function buildDealSection(slider, containerId, titleId) {
  if (titleId && slider?.name) {
    const te = document.getElementById(titleId);
    if (te) {
      const icon = te.textContent.slice(0, 2);
      const cleanName = String(slider.name).replace(/\s*\(Web\s*&\s*Mobile\)\s*/gi, '').trim();
      te.textContent = icon + ' ' + cleanName;
    }
  }
  buildDealCards(slider, containerId);
}

function buildDealCards(slider, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const items = (slider?.image_ids || []).filter(it => sliderTemplateId(it));
  if (!items.length) {
    el.innerHTML = '<div style="padding:20px;color:#9ca3af;font-size:13px;text-align:center">No products in this section</div>';
    return;
  }
  const cartMap = new Map(Cart.raw().map(i => [i.product_id, i.qty]));
  el.innerHTML = items.map(it => {
    const sid = it.id;
    const pid = sliderTemplateId(it);
    const name = (it.name || it.display_name || '').replace(/^\[.*?\]\s*/, '').trim();
    const imgPath = it.image_url || it.image || null;
    const imgSrc = imgPath ? API.img(imgPath) : API.sliderImg(sid);
    const inCart = (cartMap.get(pid) || 0) > 0;
    return `<div class="dp" data-pid="${pid}" data-item-id="${sid}">
      <div class="dp-img dp-nav" style="cursor:pointer">
        <img src="${imgSrc}" alt="${name.replace(/"/g, '&quot;')}" loading="lazy" decoding="async"
          style="width:100%;height:100%;object-fit:contain;display:block"
          onerror="this.style.display='none';this.nextSibling.style.display='flex'">
        <span style="font-size:36px;display:none;align-items:center;justify-content:center;width:100%;height:100%">📦</span>
      </div>
      <div class="dp-nm dp-nav" style="cursor:pointer">${name || 'Product'}</div>
      <div class="dp-price" id="dpp-${sid}"><span style="color:#9ca3af;font-size:10px">Loading...</span></div>
      <div class="cd-qty-ctrl" data-pid="${pid}" data-item-id="${sid}" data-pdenc="" data-btnclass="dp-atc" style="margin-top:auto">
        ${inCart ? dealQtyHtml(pid, cartMap.get(pid)) : '<button type="button" class="dp-atc" disabled style="opacity:.7">Loading...</button>'}
      </div>
    </div>`;
  }).join('');
  enrichDealCards(items.map(it => ({ pid: sliderTemplateId(it), sid: it.id, item: it })));
}

async function enrichDealCards(items) {
  const pids = items.map(it => it.pid).filter(Boolean);
  if (!pids.length) return;
  const prodsMap = await fetchProductsByIds(pids);

  for (const { sid, item } of items) {
    const card = document.querySelector(`.dp[data-item-id="${sid}"]`);
    const priceEl = document.getElementById(`dpp-${sid}`);
    const wrap = card?.querySelector('.cd-qty-ctrl');
    const navEls = card?.querySelectorAll('.dp-nav');
    const p = await resolveProductFromSliderItem(item, prodsMap);
    const pid = p?.id || sliderTemplateId(item);

    if (!p || !pid) {
      if (priceEl) priceEl.innerHTML = '<span style="color:#9ca3af;font-size:12px">Out of Stock</span>';
      if (wrap) wrap.innerHTML = '<button type="button" class="dp-atc" disabled style="background:#9ca3af">Out of Stock</button>';
      card?.removeAttribute('data-href');
      navEls?.forEach(n => { n.style.cursor = 'default'; });
      continue;
    }
    if (card && String(card.getAttribute('data-pid')) !== String(pid)) {
      card.setAttribute('data-pid', pid);
      wrap?.setAttribute('data-pid', pid);
    }

    const price = parseFloat(p.list_price || 0);
    const std = parseFloat(p.standard_price || 0);
    const qty = p.qty_available !== undefined ? parseFloat(p.qty_available) : -1;
    const oos = qty === 0;
    const payload = cartPayloadFromProduct(p);
    const pdEnc = encodeURIComponent(JSON.stringify(payload));
    const imgSrc = payload.image;
    const imgEl = card?.querySelector('.dp-img img');

    card?.setAttribute('data-href', `product.html?id=${pid}`);
    navEls?.forEach(n => { n.style.cursor = 'pointer'; });
    if (priceEl) {
      priceEl.innerHTML = price > 0
        ? `<strong style="color:#a01820">AED ${price.toFixed(2)}</strong>${std > price ? `<span style="color:#9ca3af;text-decoration:line-through;font-size:9px;margin-left:4px">${std.toFixed(2)}</span>` : ''}`
        : '<span style="color:#9ca3af;font-size:12px">Price unavailable</span>';
    }
    if (imgEl && p.image_1024) { imgEl.src = imgSrc; imgEl.style.display = 'block'; }

    if (wrap) {
      wrap.setAttribute('data-pdenc', pdEnc);
      if (oos) {
        wrap.innerHTML = '<button type="button" class="dp-atc" disabled style="background:#9ca3af">Out of Stock</button>';
      } else {
        renderDealQtyCtrl(wrap, pid, pdEnc, 'dp-atc');
      }
    }
  }
  tick();
}

function initDealCardInteractions() {
  if (document.body._dealCardsInit) return;
  document.body._dealCardsInit = true;
  document.addEventListener('click', e => {
    if (e.target.closest('.cd-qty-ctrl, .dp-atc, button')) return;
    const nav = e.target.closest('.dp-nav');
    if (!nav) return;
    const card = nav.closest('.dp');
    const href = card?.getAttribute('data-href');
    if (href) location.href = href;
  });
}

/* ── WISHLIST ─────────────────────────────────────────── */
const WL={
  get(){return JSON.parse(localStorage.getItem('cd_wl')||'[]');},
  toggle(id,name){const wl=this.get();const i=wl.findIndex(x=>x.id===id);if(i>-1){wl.splice(i,1);toast('Removed ♡');}else{wl.push({id,name});toast('Saved ❤️');}localStorage.setItem('cd_wl',JSON.stringify(wl));}
};

/* ── SESSION / HEADER USER STATE ─────────────────────── */
function closeUserMenu(){
  const dd=document.getElementById('userMenuDd');
  const trigger=document.querySelector('.u-menu-trigger');
  dd?.classList.remove('open');
  trigger?.setAttribute('aria-expanded','false');
}

function initUserMenu(){
  const wrap=document.querySelector('.user-menu-wrap');
  if(!wrap||wrap._umInit)return;
  wrap._umInit=true;
  const trigger=wrap.querySelector('.u-menu-trigger');
  const dd=document.getElementById('userMenuDd');
  trigger?.addEventListener('click',e=>{
    e.stopPropagation();
    const open=dd?.classList.toggle('open');
    trigger.setAttribute('aria-expanded',open?'true':'false');
  });
  wrap.querySelector('.user-menu-logout')?.addEventListener('click',async e=>{
    e.preventDefault();
    closeUserMenu();
    await API.logout();
    Cart.clear();
    toast('Signed out');
    setTimeout(()=>location.href='index.html',600);
  });
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))closeUserMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeUserMenu();});
}

function updateHeaderUser(){
  initUserMenu();
  const user=API.me();
  if(user?.uid){
    const nm=user.name?user.name.split(' ')[0]:'Account';
    const full=user.name||'My Account';
    document.querySelectorAll('.u-name').forEach(el=>el.textContent=nm);
    document.querySelectorAll('.user-menu-fullname').forEach(el=>el.textContent=full);
    document.querySelectorAll('.u-avatar').forEach(el=>{
      el.textContent=nm.charAt(0).toUpperCase();
    el.style.cssText='background:#ED1C24;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800';
    });
    document.querySelectorAll('.signin-only').forEach(el=>el.style.display='none');
    document.querySelectorAll('.signedin-only').forEach(el=>el.style.display='flex');
    closeUserMenu();
  }else{
    document.querySelectorAll('.u-name').forEach(el=>el.textContent='Sign In');
    document.querySelectorAll('.u-avatar').forEach(el=>{el.textContent='👤';el.style.cssText='';});
    document.querySelectorAll('.signin-only').forEach(el=>el.style.display='');
    document.querySelectorAll('.signedin-only').forEach(el=>el.style.display='none');
    closeUserMenu();
  }
}

/* ── COUNTDOWN ────────────────────────────────────────── */
let _cdI;
function startCD(ms){
  clearInterval(_cdI);
  const upd=()=>{const d=Math.max(0,ms-Date.now()),h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000);document.querySelectorAll('.cd-h').forEach(e=>e.textContent=String(h).padStart(2,'0'));document.querySelectorAll('.cd-m').forEach(e=>e.textContent=String(m).padStart(2,'0'));document.querySelectorAll('.cd-s').forEach(e=>e.textContent=String(s).padStart(2,'0'));};
  upd();_cdI=setInterval(upd,1000);
}

/* ── LANGUAGE ─────────────────────────────────────────── */
function toggleLang(){const curr=localStorage.getItem('cd_lang')||'en';applyLang(curr==='en'?'ar':'en');}
function applyLang(lang){
  document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  localStorage.setItem('cd_lang',lang);
  document.querySelectorAll('.en').forEach(e=>e.style.display=lang==='en'?'':'none');
  document.querySelectorAll('.ar').forEach(e=>e.style.display=lang==='ar'?'':'none');
  document.querySelectorAll('.lang-lbl').forEach(e=>e.textContent=lang==='ar'?'English':'العربية');
}

/* ── OTP HELPERS ──────────────────────────────────────── */
function initOtpInputs(containerSel){
  const inputs=[...document.querySelectorAll(`${containerSel} .otp-inp`)];
  inputs.forEach((inp,i)=>{
    inp.addEventListener('input',e=>{const v=e.target.value.replace(/\D/g,'');inp.value=v.slice(0,1);if(v&&i<inputs.length-1)inputs[i+1].focus();});
    inp.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!inp.value&&i>0)inputs[i-1].focus();});
    inp.addEventListener('paste',e=>{e.preventDefault();const paste=(e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'');paste.split('').forEach((c,j)=>{if(inputs[i+j])inputs[i+j].value=c;});if(inputs[Math.min(i+paste.length,inputs.length-1)])inputs[Math.min(i+paste.length,inputs.length-1)].focus();});
  });
}
function getOtp(containerSel){return[...document.querySelectorAll(`${containerSel} .otp-inp`)].map(i=>i.value).join('');}

// Simulate OTP send (replace with real email service)
// ⚠️  WARNING: Simulated OTP — NOT production-safe.
// Replace with a real email/SMS API (e.g. SendGrid, Twilio) before going live.
async function sendOtp(email){
  console.warn('[OTP] Using simulated OTP — NOT suitable for production. Integrate a real email/SMS provider.');
  const otp=Math.floor(100000+Math.random()*900000).toString();
  sessionStorage.setItem('_otp_'+email.replace(/[^a-z0-9]/gi,'_'),otp);
  sessionStorage.setItem('_otp_ts',Date.now().toString());
  console.log(`OTP for ${email}: ${otp}`); // In production, send via email API
  return otp;
}
function verifyOtp(email,input){
  console.warn('[OTP] Using simulated OTP verification — NOT suitable for production.');
  const stored=sessionStorage.getItem('_otp_'+email.replace(/[^a-z0-9]/gi,'_'));
  const ts=parseInt(sessionStorage.getItem('_otp_ts')||'0');
  if(Date.now()-ts>600000)return false; // 10 min expiry
  return stored&&stored===input;
}

/* ── GLOBAL INIT ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  initDealCardInteractions();
  // Inject skeleton CSS
  if(!document.getElementById('sk-st')){const s=document.createElement('style');s.id='sk-st';s.textContent='@keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}.skel{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:sk 1.5s infinite}';document.head.appendChild(s);}
  Bar.init();
  // Initialize Odoo App Error Logger (global uncaught error handlers)
  if (typeof ErrorLogger !== 'undefined' && ErrorLogger.init) ErrorLogger.init();
  // Cart overlay
  if(!document.getElementById('cOv')){const o=document.createElement('div');o.id='cOv';o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9400;display:none;backdrop-filter:blur(4px)';o.onclick=closeDrw;document.body.appendChild(o);}
  // Modal close on backdrop click
  document.querySelectorAll('.mo').forEach(mo=>mo.addEventListener('click',e=>{if(e.target===mo)mo.classList.remove('open');}));
  tick();
  updateHeaderUser(); // ALWAYS run to show correct login state
  applyLang(localStorage.getItem('cd_lang')||'en');
  startCD(Date.now()+5*3600000);
  // Warm common, cacheable endpoints in background.
  if(typeof API?.prefetchCoreData==='function') API.prefetchCoreData().catch(()=>{});
  // Search
  document.querySelector('.srch-inp')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim())location.href=`shop.html?q=${encodeURIComponent(e.target.value.trim())}`;});
  document.querySelector('.srch-btn')?.addEventListener('click',()=>{const v=document.querySelector('.srch-inp')?.value?.trim();if(v)location.href=`shop.html?q=${encodeURIComponent(v)}`;});
  // Mark active nav link
  const path=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-a,.mna').forEach(a=>{const href=a.getAttribute('href')||'';if(href===path||href.includes(path.split('.')[0]))a.classList.add('on');});

  // Check for pending cart additions
  if (API.loggedIn()) {
    const pending = localStorage.getItem('pending_cart_add');
    if (pending) {
      localStorage.removeItem('pending_cart_add');
      setTimeout(() => {
        addToCart(pending).catch(console.error);
      }, 500);
    }
  }
});
