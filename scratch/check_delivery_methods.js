const http = require('http');

http.get('http://localhost:3001/proxy/api/delivery-method?user_id=2', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw data:', data);
    }
  });
}).on('error', (err) => {
  console.error("Error: " + err.message);
});
