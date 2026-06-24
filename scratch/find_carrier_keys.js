const http = require('http');

http.get('http://localhost:3001/proxy/api/delivery-method?user_id=2', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.data && parsed.data[0]) {
        console.log(Object.keys(parsed.data[0]).sort());
      } else {
        console.log('No data or empty data');
      }
    } catch (e) {
      console.log('Error parsing:', e.message);
    }
  });
});
