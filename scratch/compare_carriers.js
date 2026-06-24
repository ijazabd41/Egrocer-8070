const http = require('http');

http.get('http://localhost:3001/proxy/api/delivery-method?user_id=2', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.data) {
        parsed.data.forEach(carrier => {
          console.log(`Carrier: ${carrier.name} (ID: ${carrier.id})`);
          // Print all fields that have a value
          const nonZeroFields = {};
          Object.entries(carrier).forEach(([k, v]) => {
            if (v !== 0 && v !== '0' && v !== '' && v !== null && (Array.isArray(v) ? v.length > 0 : true)) {
              nonZeroFields[k] = v;
            }
          });
          console.log(JSON.stringify(nonZeroFields, null, 2));
          console.log('-'.repeat(40));
        });
      }
    } catch (e) {
      console.log('Error parsing:', e.message);
    }
  });
});
