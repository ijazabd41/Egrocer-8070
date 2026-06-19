import os

with open('website/account.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the Shareholder Functions
old_functions_start = '// --- SHAREHOLDER FUNCTIONS ---'
old_functions_end = 'var addrOffset = 0;'

new_functions = """// --- SHAREHOLDER FUNCTIONS ---
async function loadShareholderCertificates() {
  var c = document.getElementById('certificatesContent');
  c.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af">⏳ Loading Certificates...</div>';
  try {
    var shNum = localStorage.getItem('cd_shareholder_number');
    if (!shNum) throw new Error('Shareholder number not found in session');
    var r = await API.getShareholderCertificates(shNum);
    var data = r?.certificates || r?.result?.certificates || r?.data || r?.result || [];
    if(!Array.isArray(data)) data = [data];
    if(!data.length || (data.length === 1 && !data[0].share_id && !data[0].id)){ c.innerHTML='<div style="padding:40px;text-align:center;color:#6b7280">No certificates found.</div>'; return; }
    
    var html = data.map(function(cert){
      if(!cert) return '';
      var certNum = cert.certificate_number || cert.reference || cert.name || cert.id || 'N/A';
      var shares = cert.number_of_shares || cert.num_shares || 0;
      var val = cert.total_value || cert.total_share_value || 0;
      
      var btns = '';
      if(cert.download_url_eic26_en) btns += '<a href="'+cert.download_url_eic26_en+'" target="_blank" class="sbtn" style="padding:6px 12px;font-size:11px;min-width:auto;">EN PDF</a>';
      if(cert.download_url_eic26_ar) btns += '<a href="'+cert.download_url_eic26_ar+'" target="_blank" class="sbtn" style="padding:6px 12px;font-size:11px;min-width:auto;background:#374151;">AR PDF</a>';
      if(!btns && cert.url) btns += '<a href="'+cert.url+'" target="_blank" class="sbtn" style="padding:6px 12px;font-size:11px;min-width:auto;">Download PDF</a>';
      
      return '<div class="fs" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'
        + '<div><div style="font-weight:800;font-size:14px;">Certificate #'+certNum+'</div>'
        + '<div style="font-size:12px;color:#6b7280;margin-top:2px;">Shares: '+parseFloat(shares).toLocaleString()+' | Value: AED '+parseFloat(val).toLocaleString()+'</div></div>'
        + (btns ? '<div style="display:flex;gap:6px;">'+btns+'</div>' : '')
        + '</div>';
    }).join('');
    c.innerHTML = html;
  } catch(e) {
    c.innerHTML = '<div style="padding:20px;color:var(--red);">❌ '+(e.message || 'Failed to load certificates')+'</div>';
  }
}

async function loadShareholderRewards() {
  var c = document.getElementById('shRewardsContent');
  c.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af">⏳ Loading Rewards...</div>';
  try {
    var shNum = localStorage.getItem('cd_shareholder_number');
    if (!shNum) throw new Error('Shareholder number not found in session');
    var r = await API.getShareholderRewards(shNum);
    var data = r?.rewards || r?.result?.rewards || r?.data || r?.result || [];
    if(!Array.isArray(data)) data = [data];
    
    var totalPts = r?.total_points ?? r?.balance ?? r?.result?.total_points ?? null;
    var totalBalanceHtml = '';
    if (totalPts !== null) {
      totalBalanceHtml = '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center;">'
        + '<div style="font-size:12px;color:#b91c1c;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Total Reward Balance</div>'
        + '<div style="font-size:28px;font-weight:900;color:var(--red);">' + parseFloat(totalPts).toLocaleString() + '</div>'
        + '</div>';
    }

    if(!data.length || (data.length === 1 && !data[0].id && !data[0].name)){ 
      c.innerHTML = totalBalanceHtml + '<div style="padding:40px;text-align:center;color:#6b7280">No rewards found.</div>'; 
      return; 
    }
    
    var html = data.map(function(rew){
      if(!rew) return '';
      var name = rew?.name || 'Dividend/Reward';
      var amt = parseFloat(rew?.amount ?? 0);
      var points = rew?.points ?? null;
      var date = rew?.date ? String(rew.date).slice(0,10) : 'N/A';
      return '<div class="fs" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'
        + '<div><div style="font-weight:800;font-size:14px;color:var(--red);">'+name+'</div>'
        + '<div style="font-size:12px;color:#6b7280;margin-top:2px;">Date: '+date+(points !== null ? ' | Points: '+parseFloat(points).toLocaleString() : '')+'</div></div>'
        + '<div style="font-weight:900;color:var(--gray-900);">AED '+amt.toLocaleString()+'</div>'
        + '</div>';
    }).join('');
    
    c.innerHTML = totalBalanceHtml + html;
  } catch(e) {
    c.innerHTML = '<div style="padding:20px;color:var(--red);">❌ '+(e.message || 'Failed to load rewards')+'</div>';
  }
}

async function loadShareholderPurchases() {
  var c = document.getElementById('shPurchasesContent');
  c.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af">⏳ Loading Purchases...</div>';
  try {
    var shNum = localStorage.getItem('cd_shareholder_number');
    if (!shNum) throw new Error('Shareholder number not found in session');
    
    var dFrom = document.getElementById('shPurchasesFrom')?.value;
    var dTo = document.getElementById('shPurchasesTo')?.value;
    
    var r = await API.getShareholderPurchases(shNum, dFrom, dTo);
    var data = r?.purchases || r?.result?.purchases || r?.orders || r?.data || r?.result || [];
    if(!Array.isArray(data)) data = [data];
    
    var totalAmt = parseFloat(r?.total_amount ?? r?.result?.total_amount ?? 0);
    var totalOrders = parseInt(r?.total_orders ?? r?.result?.total_orders ?? data.length);
    var summaryHtml = '';
    
    if (totalAmt > 0 || totalOrders > 0) {
      summaryHtml = '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'
        + '<div><div style="font-size:11px;color:#b91c1c;font-weight:700;text-transform:uppercase;">Total Purchases</div>'
        + '<div style="font-size:12px;color:#991b1b;margin-top:2px;font-weight:600;">'+totalOrders+' Orders</div></div>'
        + '<div style="font-size:20px;font-weight:900;color:var(--red);">AED ' + totalAmt.toLocaleString() + '</div>'
        + '</div>';
    }

    if(!data.length || (data.length === 1 && !data[0].id && !data[0].name)){ 
      c.innerHTML = summaryHtml + '<div style="padding:40px;text-align:center;color:#6b7280">No linked purchases found.</div>'; 
      return; 
    }
    
    var html = data.map(function(order){
      if(!order) return '';
      var amt = parseFloat(order?.amount_total || order?.total || order?.amount || 0);
      var name = order?.name || order?.order_name || 'Order #'+(order?.id || 'Unknown');
      var d = order?.date_order || order?.date || '';
      return '<div class="fs" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'
        + '<div><div style="font-weight:800;font-size:14px;">'+name+'</div>'
        + '<div style="font-size:12px;color:#6b7280;margin-top:2px;">Date: '+(d ? String(d).slice(0,10) : 'N/A')+'</div></div>'
        + '<div style="font-weight:900;color:var(--red-d);">AED '+amt.toLocaleString()+'</div>'
        + '</div>';
    }).join('');
    
    c.innerHTML = summaryHtml + html;
  } catch(e) {
    c.innerHTML = '<div style="padding:20px;color:var(--red);">❌ '+(e.message || 'Failed to load purchases')+'</div>';
  }
}

async function linkShareholderOrder() {
  var btn = document.getElementById('shLinkBtn') || event.currentTarget;
  var oid = document.getElementById('linkOrderId')?.value?.trim();
  var msg = document.getElementById('linkOrderMsg');
  
  if(!msg) return;
  if(!oid) { msg.textContent = 'Please enter an Order ID'; msg.style.color='var(--red)'; return; }
  
  msg.textContent = '⏳ Linking order...'; msg.style.color='#9ca3af';
  if(btn) btn.disabled = true;

  try {
    var shNum = localStorage.getItem('cd_shareholder_number');
    if (!shNum) throw new Error('Shareholder session not found');
    
    var r = await API.linkShareholderOrder(shNum, oid);
    
    if(r && r.error) throw new Error(r.error);
    if(r && r.result && r.result.error) throw new Error(r.result.error);
    if(r && r.success === 0) throw new Error(r.message || r.error || 'Failed to link order');
    
    msg.textContent = '✅ Order successfully linked!'; msg.style.color='#065f46';
    document.getElementById('linkOrderId').value = '';
    
    setTimeout(function() {
      msg.textContent = '';
      loadShareholderPurchases();
    }, 1500);
  } catch(e) {
    msg.textContent = '❌ '+(e.message || 'Failed to link order'); msg.style.color='var(--red)';
  } finally {
    if(btn) btn.disabled = false;
  }
}

"""

i_start = content.find(old_functions_start)
i_end = content.find(old_functions_end)

if i_start != -1 and i_end != -1:
    content = content[:i_start] + new_functions + content[i_end:]
else:
    print("Could not find functions block")


# 2. Replace the HTML Tab
html_tab_start = '<div class="pg-tab" id="tab-sh-purchases">'
html_tab_end_marker = '<div id="shPurchasesContent">'

j_start = content.find(html_tab_start)
j_inner = content.find(html_tab_end_marker, j_start)
j_end = content.find('</div>', content.find('</div>', j_inner) + 6) + 6 # Needs to find </div></div> 

if j_start != -1 and j_end != -1:
    new_tab = """<div class="pg-tab" id="tab-sh-purchases">
        <h2 style="font-size:17px;font-weight:800;margin-bottom:16px">🛍️ Shareholder Purchases</h2>
        
        <div class="fs" style="margin-bottom:20px;background:#f9fafb;border:1px dashed #d1d5db;">
          <h3 style="font-size:14px;font-weight:800;margin-bottom:8px;">Link Past Order</h3>
          <p style="font-size:12px;color:#6b7280;margin-bottom:12px;">Enter an Order ID (e.g. S10245) to link it to your shareholder account.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <input type="text" id="linkOrderId" class="fi" placeholder="Order ID or Name" style="max-width:250px;">
            <button id="shLinkBtn" onclick="linkShareholderOrder()" class="sbtn" style="max-width:max-content;padding:0 20px;">Link Order</button>
          </div>
          <div id="linkOrderMsg" style="font-size:12px;margin-top:8px;font-weight:600;"></div>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
          <div style="display:flex;align-items:center;gap:6px;"><label style="font-size:12px;color:#6b7280;font-weight:700;">From</label><input type="date" id="shPurchasesFrom" class="fi" style="max-width:140px;padding:8px;font-size:12px;"></div>
          <div style="display:flex;align-items:center;gap:6px;"><label style="font-size:12px;color:#6b7280;font-weight:700;">To</label><input type="date" id="shPurchasesTo" class="fi" style="max-width:140px;padding:8px;font-size:12px;"></div>
          <button onclick="loadShareholderPurchases()" class="sbtn" style="padding:8px 16px;font-size:12px;max-width:max-content;">Filter</button>
        </div>

        <div id="shPurchasesContent"><div style="text-align:center;padding:40px;color:#9ca3af">⏳ Loading...</div></div>
      </div>"""
    content = content[:j_start] + new_tab + content[j_end:]
else:
    print("Could not find HTML tab block")

with open('website/account.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
