const fs = require('fs');
const files = [
  'web1_owner_dashboard.html',
  'web1_stock_dashboard.html',
  'web1_delivery_dashboard.html',
  'web6_owner_dashboard.html',
  'web6_stock_dashboard.html',
  'web6_delivery_dashboard.html'
];
files.forEach(f => {
  try {
    const p = 'website/' + f;
    let c = fs.readFileSync(p, 'utf8');
    if (c.includes('<div id="err" class="error-msg"></div>')) {
      c = c.replace('<div id="err" class="error-msg"></div>', '<div id="err" class="error-msg" style="display:none"></div>');
      fs.writeFileSync(p, c);
      console.log('Fixed', f);
    }
  } catch (e) {
    console.error(e.message);
  }
});
