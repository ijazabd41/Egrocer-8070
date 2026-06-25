const fs = require('fs');

let appJs = fs.readFileSync('website/js/app.js', 'utf8');
const searchApp = `    const r = await API.getDeliveryMethods();
    if(r && r.data) {
      const hm = r.data.find(m => /home|delivery/i.test(m.name || '') && String(m.free_over).toLowerCase() === 'true');
      if (hm && hm.amount) window._cd_free_delivery_amount = parseFloat(hm.amount);
      else {
        const any = r.data.find(m => String(m.free_over).toLowerCase() === 'true');
        if (any && any.amount) window._cd_free_delivery_amount = parseFloat(any.amount);
      }
    }`;
const replaceApp = `    const r = await API.getDeliveryMethods();
    if(r && r.data) {
      const isFree = m => m.free_over === true || m.free_over === 1 || String(m.free_over).toLowerCase() === 'true';
      const hm = r.data.find(m => /home|delivery/i.test(m.name || '') && isFree(m));
      if (hm && hm.amount) window._cd_free_delivery_amount = parseFloat(hm.amount);
      else {
        const any = r.data.find(m => isFree(m));
        if (any && any.amount) window._cd_free_delivery_amount = parseFloat(any.amount);
      }
    }`;
appJs = appJs.replace(searchApp, replaceApp);
fs.writeFileSync('website/js/app.js', appJs, 'utf8');


let chkHtml = fs.readFileSync('website/checkout.html', 'utf8');
const searchChk = `if (selDeliveryMethod && String(selDeliveryMethod.free_over).toLowerCase() === 'true' && selDeliveryMethod.amount) {`;
const replaceChk = `const isFree = m => m.free_over === true || m.free_over === 1 || String(m.free_over).toLowerCase() === 'true';
      if (selDeliveryMethod && isFree(selDeliveryMethod) && selDeliveryMethod.amount) {`;
// There are two instances in checkout.html
chkHtml = chkHtml.split(searchChk).join(replaceChk);
// Need to adjust indentation for the first instance if necessary, but split/join is literal
fs.writeFileSync('website/checkout.html', chkHtml, 'utf8');
