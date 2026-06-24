const http = require('http');

const ODOO = 'http://cooperp.freeddns.org:8077';
const DB = 'production';

function postJson(path, body, headers = {}) {
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
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    };
    const req = http.request(opts, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => {
        try {
          resolve({
            data: JSON.parse(respData),
            headers: res.headers
          });
        } catch(e) {
          resolve({ data: respData, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const authPayload = {
    jsonrpc: '2.0',
    method: 'call',
    id: 1,
    params: {
      db: DB,
      login: 'itcom1020@gmail.com',
      password: 'dds@123'
    }
  };
  
  try {
    const authRes = await postJson('/web/session/authenticate', authPayload);
    console.log("Auth Response Status:", authRes.data);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
