/* Coop Discounts Layout v6 — Mobile nav with cart, session-aware header */
document.addEventListener('DOMContentLoaded',async()=>{
  const h=document.getElementById('site-header');
  const f=document.getElementById('site-footer');
  if(h){
    h.innerHTML=buildHeader();
    if(typeof updateHeaderUser === 'function') updateHeaderUser();
  }
  if(f)f.innerHTML=buildFooter();
  loadLogo();
  loadNavCats();
});

// Logo slider ID — change this if the Odoo slider record is recreated.
const LOGO_SLIDER_ID = 12;

async function loadLogo(){
  try{
    const src = API.img('/web/image/res.company/1/logo');
    document.querySelectorAll('.co-logo').forEach(img=>{
      img.src=src;
      img.style.display='block';
      img.onload=()=>{
        document.querySelectorAll('.r-logo-icon').forEach(e=>e.style.display='none');
      };
      img.onerror=()=>img.style.display='none';
    });
  }catch(_){}
}

async function loadNavCats(){
  try{
    const r=await API.getCats();
    const cats=r.data||[];
    if(!cats.length)return;
    // Category modal
    const g=document.getElementById('catGrid');
    if(g){
      g.innerHTML='';
      cats.forEach(c=>{
        // image_1024 is a PATH — must proxy
        const imgSrc=c.image_1024?API.img(c.image_1024):API.catImg(c.id);
        const a=document.createElement('a');
        a.href=`shop.html?cat_id=${c.id}&cat_name=${encodeURIComponent(c.name)}`;
        a.onclick=()=>closeModal('catMo');
        a.style.cssText='display:flex;align-items:center;gap:10px;padding:11px;background:#f9fafb;border-radius:12px;border:1.5px solid #e5e7eb;text-decoration:none;color:#111;transition:all .2s';
        a.onmouseover=function(){this.style.background='#fef2f2';this.style.borderColor='#ED1C24';};
        a.onmouseout=function(){this.style.background='#f9fafb';this.style.borderColor='#e5e7eb';};
        a.innerHTML=`<div style="width:36px;height:36px;border-radius:8px;overflow:hidden;background:#fee2e2;flex-shrink:0;display:flex;align-items:center;justify-content:center">
          <img src="${imgSrc}" alt="${c.name}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.parentElement.innerHTML='🏷️'">
        </div>
        <div>
          <div style="font-size:12px;font-weight:700">${c.name}</div>
          ${c.product_tmpl_ids?.length?`<div style="font-size:10px;color:#9ca3af">${c.product_tmpl_ids.length} items</div>`:''}
        </div>`;
        g.appendChild(a);
      });
    }
    // Search dropdown
    const sel=document.getElementById('srchSel');
    if(sel)cats.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;sel.appendChild(o);});
    // Shop sidebar
    const sb=document.getElementById('shopSidebar');
    if(sb){
      sb.innerHTML='';
      cats.forEach(c=>{
        const imgSrc=c.image_1024?API.img(c.image_1024):API.catImg(c.id);
        const d=document.createElement('div');
        d.className='sb-item';d.id=`sbc-${c.id}`;
        d.innerHTML=`<div class="sb-img"><img src="${imgSrc}" alt="${c.name}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none'"></div>
          <span style="flex:1">${c.name}</span>
          ${c.product_tmpl_ids?.length?`<span style="background:#f3f4f6;font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px;color:#6b7280;flex-shrink:0">${c.product_tmpl_ids.length}</span>`:''}`;
        d.onclick=()=>filterCat(c.id,c.name);
        sb.appendChild(d);
      });
    }
  }catch(e){console.warn('loadNavCats:',e);}
}

function buildHeader(){
  return `
<div class="r-topbar">
      <div class="ctr">
        <div class="r-topbar-left">
          <div class="r-loc-tab">Select location</div>
          <div class="r-deliv-msg">Delivery Available in Sharjah, Ajman & Dubai Areas</div>
        </div>
        <div class="r-topbar-right">
          <button class="r-lang-btn" onclick="toggleLang()">ع</button>
          <button class="r-lang-btn" style="background:#f3f4f6">En</button>
        </div>
      </div>
    </div>

    <div class="r-main-hdr">
      <div class="ctr">
        <a href="index.html" class="r-logo" style="display:flex; align-items:center; gap:10px; text-decoration:none;">
          <img src="" class="co-logo" style="display:none; max-height:48px;" alt="Coop Discounts Logo">
          <div style="display:flex; flex-direction:column; justify-content:center;">
            <div class="r-logo-text" style="color:var(--rd,#ED1C24); font-weight:900; font-size:18px; line-height:1.1; margin-bottom:1px;">COOP DISCOUNTS</div>
            <div style="color:#374151; font-size:11px; font-weight:800; line-height:1.2; margin-bottom:2px;">Hyper Market</div>
            <div style="color:#6b7280; font-size:9px; font-weight:600; line-height:1; letter-spacing:0.2px;">Customer Cooperation Society</div>
          </div>
        </a>

        <div class="r-search">
          <input type="text" placeholder="Search for fresh food, electronics..." id="r-search-inp"
            onkeypress="if(event.key==='Enter'){location.href='shop.html?q='+encodeURIComponent(this.value)}">
          <button
            onclick="location.href='shop.html?q='+encodeURIComponent(document.getElementById('r-search-inp').value)">🔍</button>
        </div>

        <div class="r-actions">
          <a href="offers.html" class="r-icon-btn light" title="Offers">🏷️</a>
          <a href="account.html" class="r-icon-btn solid" title="Account">👤</a>
          <button onclick="openDrw()" class="r-icon-btn solid" title="Cart">
            🛒<span class="r-cart-badge" id="hCartBadge">0</span>
          </button>
        </div>
      </div>
    </div>

    <div class="r-bottom-nav">
      <div class="ctr" style="justify-content: space-between;">
        <button class="r-cat-btn" onclick="openModal('catMo')">
          <span style="font-size:18px;margin-top:-2px">⊞</span> <span class="cat-btn-text">All Categories ⌄</span>
        </button>
        <div class="r-nav-links" id="rNavLinks">
          <a href="index.html">Home</a>
          <a href="offers.html" style="display:flex; align-items:center; gap:6px;">
            Hot Deals
            <span style="background:#FFF200; color:#111; font-size:11px; font-weight:900; padding:3px 8px; border-radius:12px; letter-spacing:0.5px;">SALE</span>
          </a>
          <a href="shop.html">All Products</a>
          <a href="account.html">My Account</a>
          <a href="track-order.html">Track Order</a>
          <a href="contact.html">Contact</a>
        </div>
        <div class="r-nav-badges"
          style="display:flex; gap:10px; align-items:center; padding-right:10px; flex-shrink:0;">
          <div
            style="background:#FFF200; color:#111; padding:4px 12px; border-radius:20px; display:flex; align-items:center; gap:6px; white-space:nowrap; flex-shrink:0;">
            <span style="font-size:18px;">🚚</span>
            <div style="display:flex; align-items:center; line-height:1.1;">
              <span style="font-weight:800; font-size:12px;">Free delivery above 150</span>
            </div>
          </div>
          <div
            style="background:#10b981; color:#fff; padding:4px 12px; border-radius:20px; display:flex; align-items:center; gap:6px; white-space:nowrap; flex-shrink:0;">
            <span style="font-size:18px;">⏱️</span>
            <div style="display:flex; align-items:center; line-height:1.1;">
              <span style="font-weight:800; font-size:12px;">Express delivery</span>
            </div>
          </div>
        </div>
        <button class="r-hamburger" onclick="document.getElementById('rNavLinks').classList.toggle('open')">☰ Menu</button>
      </div>
    </div>

<!-- Cart Drawer -->
<div class="cart-drw" id="cDrw" role="dialog" aria-label="Shopping cart">
  <div class="drw-hdr">
    <h3>🛒 <span class="en">My Cart</span><span class="ar" style="display:none">سلة التسوق</span></h3>
    <button onclick="closeDrw()" style="font-size:20px;background:none;border:none;cursor:pointer;color:#6b7280;padding:4px" aria-label="Close cart">✕</button>
  </div>
  <div class="drw-body" id="cDrwBody"></div>
  <div class="drw-ftr" id="cDrwFtr"></div>
</div>

<!-- Category Modal -->
<div class="mo" id="catMo" role="dialog" aria-label="All categories">
  <div class="mo-box" style="max-width:640px">
    <button class="mo-x" onclick="closeModal('catMo')" aria-label="Close">✕</button>
    <h2 style="font-size:18px;font-weight:900;margin-bottom:16px">
      <span class="en">All Categories</span><span class="ar" style="display:none">جميع الأقسام</span>
    </h2>
    <div id="catGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px"></div>
  </div>
</div>`;
}

function buildFooter(){
  return `
<footer class="r-footer">
    <div class="ctr">
      <div class="r-footer-grid">
        <div class="r-ftr-col">
          <h4>Shopping Categories</h4>
          <a href="offers.html">Smart Deals</a>
          <a href="shop.html">Fresh Food</a>
          <a href="shop.html">Baby Products</a>
          <a href="shop.html">Beauty & Personal Care</a>
          <a href="shop.html">Home, Patio & Kitchen</a>
          <a href="shop.html">Electronics & Appliances</a>
        </div>
        <div class="r-ftr-col">
          <h4>About Us</h4>
          <a href="#">About Coop Discounts</a>
          <a href="#">Corporate Website</a>
          <a href="#">Careers</a>
          <a href="#">Branches</a>
          <a href="#">Projects</a>
        </div>
        <div class="r-ftr-col">
          <h4>My Account</h4>
          <a href="login.html">Login or Register</a>
          <a href="wishlist.html">My Wishlist</a>
          <a href="contact.html">Contact Us</a>
          <a href="#">Corporate Customer</a>
          <a href="#">Supplier Portal</a>
        </div>
        <div class="r-ftr-col">
          <h4>Policies</h4>
          <a href="#">Terms and Conditions</a>
          <a href="#">Return Policy</a>
          <a href="#">Privacy Policy</a>
        </div>
        <div class="r-ftr-col">
          <h4>Webstore Queries</h4>
          <div style="color:#6b7280;line-height:1.6;margin-bottom:16px;">
            Al Ghandi Complex, Showroom 03<br>
            Nadd Al Hamar, Dubai, UAE<br>
            <a href="mailto:info@coop-discounts.com"
              style="color:#3b82f6;display:inline;margin:0">info@coop-discounts.com</a>
          </div>
          <div class="r-ftr-contact">
            <a href="tel:+971502760026">📞 050 276 0026</a>
            <a href="https://wa.me/971502760026" class="wa">💬 WhatsApp Us</a>
          </div>
          <div style="margin-top:20px;color:#6b7280;font-size:11px;">
            Mon to Sun from 08:00 to 00:00
          </div>
        </div>
      </div>
      <div style="padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); margin-top:20px; font-size:11px; color:#9ca3af; line-height:1.6;">
        <strong>Popular Searches:</strong> Lowest Prices Dubai | Everyday Low Prices | Best Deals Dubai | Affordable Shopping Dubai | Family Shopping Dubai | Save More Dubai | Budget Shopping Dubai | Best Grocery Prices Dubai
      </div>
      <div class="r-ftr-bottom"
        style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); margin-top:30px;">
        <div style="color:#9ca3af; font-weight:600;">
          &copy; 2026 COOP DISCOUNTS. All Rights Reserved.
        </div>
      </div>
    </div>
  </footer>

<!-- Mobile Bottom Nav — includes Cart with badge -->
<nav class="mnav" aria-label="Mobile navigation">
  <div class="mnav-in">
    <a href="index.html" class="mna"><span class="ic">🏠</span><span class="en">Home</span><span class="ar" style="display:none">الرئيسية</span></a>
    <a href="shop.html" class="mna"><span class="ic">🛍️</span><span class="en">Shop</span><span class="ar" style="display:none">تسوق</span></a>
    <a href="offers.html" class="mna"><span class="ic">🔥</span><span class="en">Deals</span><span class="ar" style="display:none">عروض</span></a>
    <button class="mna" onclick="openDrw()" style="background:none;border:none;font-family:inherit;cursor:pointer">
      <span class="ic" style="position:relative">
        🛒
        <span class="cart-badge mna-badge" id="mCartBadge" aria-live="polite">0</span>
      </span>
      <span class="en">Cart</span><span class="ar" style="display:none">سلة</span>
    </button>
    <a href="account.html" class="mna"><span class="ic">👤</span><span class="en">Account</span><span class="ar" style="display:none">حسابي</span></a>
  </div>
</nav>

<!-- Floating WhatsApp Button -->
<a href="https://wa.me/971502760026" target="_blank" class="float-wa" style="position:fixed;bottom:80px;right:20px;background:#25D366;color:#fff;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:999;text-decoration:none;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" aria-label="Chat with us on WhatsApp">
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.124.553 4.195 1.604 6.012L.15 23.364l5.474-1.436a11.954 11.954 0 0 0 6.407 1.834h.004c6.649 0 12.032-5.384 12.032-12.032C24.067 5.383 18.68 0 12.031 0zm0 21.733h-.004a9.92 9.92 0 0 1-5.068-1.385l-.364-.216-3.766.987.997-3.67-.236-.377A9.927 9.927 0 0 1 2.031 12.03c0-5.522 4.492-10.013 10.004-10.013 5.51 0 10.003 4.491 10.003 10.013 0 5.522-4.492 10.013-10.003 10.013zM17.525 14.5c-.302-.151-1.785-.88-2.062-.981-.277-.101-.479-.151-.68.151-.202.302-.781.981-.958 1.182-.176.202-.353.227-.655.076-1.637-.803-2.656-1.41-3.69-3.235-.203-.353.204-.326.638-.973.101-.151.05-.277-.025-.428-.076-.151-.68-1.637-.932-2.241-.246-.591-.495-.51-.68-.52-.176-.01-.378-.01-.58-.01-.202 0-.529.076-.806.378-.277.302-1.058 1.033-1.058 2.518 0 1.485 1.083 2.919 1.234 3.12.151.202 2.128 3.249 5.156 4.555.72.31 1.282.496 1.721.635.724.23 1.383.197 1.899.119.578-.087 1.785-.729 2.037-1.435.252-.705.252-1.31.176-1.435-.075-.125-.276-.201-.578-.352z"/></svg>
</a>`;
}

function doSearch(){
  const q=document.querySelector('.srch-inp')?.value?.trim();
  const cat=document.getElementById('srchSel')?.value;
  if(!q&&!cat)return;
  const p=[];if(q)p.push(`q=${encodeURIComponent(q)}`);if(cat)p.push(`cat_id=${cat}`);
  location.href=`shop.html?${p.join('&')}`;
}
