const http = require('http');

http.get('http://localhost:3001/proxy/api/bcd-website-category', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.data) {
        parsed.data.forEach(c => {
          console.log(`ID: ${c.id} | Name: ${c.name}`);
        });
      }
    } catch (e) {
      console.log('Error parsing:', e.message);
    }
  });
});
