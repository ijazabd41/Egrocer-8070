const fs = require('fs');

let chkHtml = fs.readFileSync('website/checkout.html', 'utf8');

const targetStr = "if (selDeliveryMethod && String(selDeliveryMethod.free_over).toLowerCase() === 'true' && selDeliveryMethod.amount) {";
const replacementStr = "const isFree = m => m.free_over === true || m.free_over === 1 || String(m.free_over).toLowerCase() === 'true';\n      if (selDeliveryMethod && isFree(selDeliveryMethod) && selDeliveryMethod.amount) {";

chkHtml = chkHtml.split(targetStr).join(replacementStr);

fs.writeFileSync('website/checkout.html', chkHtml, 'utf8');
