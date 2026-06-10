const v = "['|',('id','=',4832),('parent_id','=',4832)]"; const enc = encodeURIComponent(v).replace(/%5B/gi, '[').replace(/%5D/gi, ']').replace(/%2C/gi, ',').replace(/'/g, '%27'); console.log(enc);
