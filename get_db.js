const http = require('http');

const data = JSON.stringify({
  jsonrpc: "2.0",
  method: "call",
  params: {},
  id: Math.floor(Math.random() * 1000 * 1000 * 1000)
});

const options = {
  hostname: 'cooperp.freeddns.org',
  port: 8070,
  path: '/web/database/list',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log(responseData);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
