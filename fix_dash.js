const fs = require('fs');
const files = [
  'web1_owner_dashboard.html',
  'web1_stock_dashboard.html',
  'web1_delivery_dashboard.html',
  'web6_owner_dashboard.html',
  'web6_stock_dashboard.html',
  'web6_delivery_dashboard.html',
  'web_store_manager_delivery.html'
];
files.forEach(f => {
  try {
    const p = 'website/' + f;
    if (!fs.existsSync(p)) return;
    let c = fs.readFileSync(p, 'utf8');
    if (!c.includes('error-logger.js')) {
      c = c.replace(/<script src="cd_web_api.js([^>]*)><\/script>/g, '<script src="js/error-logger.js?v=1.0"></script>\n<script src="cd_web_api.js$1></script>');
      fs.writeFileSync(p, c);
      console.log('Injected in', f);
    } else {
      console.log('Already in', f);
    }
  } catch (e) {
    console.error('Error', f, e.message);
  }
});
