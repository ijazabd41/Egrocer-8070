const http = require('http');

const ODOO = 'http://cooperp.freeddns.org:8077';

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(`${ODOO}${path}`);
    const opts = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(opts, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(respData));
        } catch(e) {
          resolve(respData);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    const res = await postJson('/web/database/list', { jsonrpc: '2.0', method: 'call', id: 1, params: {} });
    console.log("Databases:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
