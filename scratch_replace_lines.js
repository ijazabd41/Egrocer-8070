const fs = require('fs');

function replaceLines(file, startLine, endLine, newLines) {
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  lines.splice(startLine - 1, endLine - startLine + 1, ...newLines);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
}

// 1. app.js
let appLines = [
  "      const isFree = m => m.free_over === true || m.free_over === 1 || String(m.free_over).toLowerCase() === 'true';",
  "      const hm = r.data.find(m => /home|delivery/i.test(m.name || '') && isFree(m));",
  "      if (hm && hm.amount) window._cd_free_delivery_amount = parseFloat(hm.amount);",
  "      else {",
  "        const any = r.data.find(m => isFree(m));",
  "        if (any && any.amount) window._cd_free_delivery_amount = parseFloat(any.amount);",
  "      }"
];
replaceLines('website/js/app.js', 1011, 1016, appLines.map(l => l + '\r'));

// 2. checkout.html
let chkLines1 = [
  "  const isFree = m => m.free_over === true || m.free_over === 1 || String(m.free_over).toLowerCase() === 'true';",
  "  if (selDeliveryMethod && isFree(selDeliveryMethod) && selDeliveryMethod.amount) {"
];
replaceLines('website/checkout.html', 821, 821, chkLines1.map(l => l + '\r'));

let chkLines2 = [
  "      const isFree = m => m.free_over === true || m.free_over === 1 || String(m.free_over).toLowerCase() === 'true';",
  "      if (selDeliveryMethod && isFree(selDeliveryMethod) && selDeliveryMethod.amount) {"
];
replaceLines('website/checkout.html', 1404, 1404, chkLines2.map(l => l + '\r'));
