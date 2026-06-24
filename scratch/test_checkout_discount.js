const http = require('http');

const ODOO = 'http://cooperp.freeddns.org:8077';

function getJson(path, params = {}, sessionToken = '') {
  return new Promise((resolve, reject) => {
    let url = `${ODOO}${path}`;
    const urlParams = new URLSearchParams();
    urlParams.set('by_AJR', '1');
    Object.entries(params).forEach(([k, v]) => urlParams.set(k, v));
    url += '?' + urlParams.toString();
    
    const u = new URL(url);
    const headers = {};
    if (sessionToken) {
      headers['X-Session-Token'] = sessionToken;
      headers['Cookie'] = `session_id=${sessionToken}`;
    }
    
    const opts = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    };
    
    http.get(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            data: JSON.parse(data),
            headers: res.headers
          });
        } catch(e) {
          resolve({ data: data, headers: res.headers });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const rand = Math.floor(Math.random() * 100000);
  const name = `Test User ${rand}`;
  const email = `test_user_${rand}@example.com`;
  const phone = `050${String(rand).padStart(7, '0')}`;
  const password = 'Password123';

  console.log(`Registering test user: ${email}...`);
  try {
    const regRes = await getJson('/api/contacts/new_registration', {
      name, email, phone, password, deviceid: 'web', firebase: '', latitude: '', longitude: ''
    });
    
    console.log("Registration Response:", JSON.stringify(regRes.data));
    
    let sessionId = '';
    const sc = regRes.headers['set-cookie'];
    if (sc) {
      for (const c of sc) {
        const match = c.match(/session_id=([^;]+)/);
        if (match) sessionId = match[1];
      }
    }
    const xToken = regRes.headers['x-set-session-token'];
    if (xToken) sessionId = xToken;

    console.log("Session ID:", sessionId);
    if (!sessionId) {
      console.log("Registration failed or session ID not returned.");
      return;
    }

    // 1. Create order
    console.log("Creating test order...");
    const orderRes = await getJson('/api/order/create_order', { sources: 'COOPDISCOUNT-WEB', website_id: 1 }, sessionId);
    console.log("Create order response:", orderRes.data);
    const orderId = orderRes.data.response?.[0]?.id || orderRes.data.data?.[0]?.id;
    if (!orderId) {
      console.log("Could not create test order.");
      return;
    }
    console.log("Created order ID:", orderId);

    // 2. Add product variant 78562 (AL AIN FARMS FRESH LABAN 250 ML)
    console.log("Adding product to cart...");
    const addRes = await getJson('/api/order-line/create', { order_id: orderId, product_id: 78562 }, sessionId);
    console.log("Add product response:", addRes.data);

    // 3. Test Store Pickup Discount update (5% rate, calculated amount)
    console.log("\nTesting Store Pickup Discount update...");
    const orderDataBefore = await getJson(`/api/order/${orderId}`, {}, sessionId);
    const subtotal = parseFloat(orderDataBefore.data.data?.[0]?.amount_untaxed || orderDataBefore.data.data?.[0]?.amount_undiscounted || 10); // fallback if blank
    const pickupDisc = parseFloat((subtotal * 0.05).toFixed(2));
    
    console.log(`Subtotal: ${subtotal}, Calculated Store Pickup Discount: ${pickupDisc}`);
    
    const updatePickupRes = await getJson(`/api/order/${orderId}/update`, {
      carrier_id: 3, // Store Pickup
      amount_discount: pickupDisc,
      discount_rate: 5.0,
      discount_type: 'percent'
    }, sessionId);
    console.log("Store Pickup update response:", updatePickupRes.data);

    // Fetch order to verify
    let ord = await getJson(`/api/order/${orderId}`, {}, sessionId);
    const o = ord.data.data?.[0] || ord.data.data || {};
    console.log("Order details after Store Pickup update:");
    console.log(`- Carrier ID: ${o.carrier_id}`);
    console.log(`- Amount Discount (Odoo): ${o.amount_discount}`);
    console.log(`- Subtotal: ${o.amount_untaxed}`);
    console.log(`- Total: ${o.amount_total}`);

    // 4. Test Home Delivery update (0% rate, 0 amount)
    console.log("\nTesting Home Delivery update...");
    const updateDeliveryRes = await getJson(`/api/order/${orderId}/update`, {
      carrier_id: 2, // Home Delivery
      amount_discount: 0,
      discount_rate: 0.0,
      discount_type: 'percent'
    }, sessionId);
    console.log("Home Delivery update response:", updateDeliveryRes.data);

    // Fetch order to verify
    ord = await getJson(`/api/order/${orderId}`, {}, sessionId);
    const o2 = ord.data.data?.[0] || ord.data.data || {};
    console.log("Order details after Home Delivery update:");
    console.log(`- Carrier ID: ${o2.carrier_id}`);
    console.log(`- Amount Discount (Odoo): ${o2.amount_discount}`);
    console.log(`- Subtotal: ${o2.amount_untaxed}`);
    console.log(`- Total: ${o2.amount_total}`);

  } catch (err) {
    console.error("Error during integration test:", err);
  }
}

main();
