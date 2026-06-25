const fs = require('fs');

let appJs = fs.readFileSync('website/js/app.js', 'utf8');

// Use regex to find the block
appJs = appJs.replace(
  /const hm = r\.data\.find\(m => \/home\\\|delivery\/i\.test\(m\.name \\|\\| ''\) && String\(m\.free_over\)\.toLowerCase\(\) === 'true'\);\r?\n\s*if \(hm && hm\.amount\) window\._cd_free_delivery_amount = parseFloat\(hm\.amount\);\r?\n\s*else \{\r?\n\s*const any = r\.data\.find\(m => String\(m\.free_over\)\.toLowerCase\(\) === 'true'\);\r?\n\s*if \(any && any\.amount\) window\._cd_free_delivery_amount = parseFloat\(any\.amount\);\r?\n\s*\}/g,
  `const isFree = m => m.free_over === true || m.free_over === 1 || String(m.free_over).toLowerCase() === 'true';\n      const hm = r.data.find(m => /home|delivery/i.test(m.name || '') && isFree(m));\n      if (hm && hm.amount) window._cd_free_delivery_amount = parseFloat(hm.amount);\n      else {\n        const any = r.data.find(m => isFree(m));\n        if (any && any.amount) window._cd_free_delivery_amount = parseFloat(any.amount);\n      }`
);

fs.writeFileSync('website/js/app.js', appJs, 'utf8');
