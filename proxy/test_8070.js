const http = require('http');

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://cooperp.freeddns.org:8070${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function run() {
    try {
        const pm = await get('/api/payment-provider?domain=[("state","in",["enabled","test"])]&by_AJR=1');
        console.log("Payment Providers:");
        if (pm.data) {
            pm.data.forEach(p => console.log(`  ID: ${p.id}, Name: ${p.name}, State: ${p.state}`));
        } else {
            console.log(pm);
        }

        const dm = await get('/api/delivery-method?user_id=2&by_AJR=1');
        console.log("\nDelivery Methods:");
        if (dm.data) {
            dm.data.forEach(d => console.log(`  ID: ${d.id}, Name: ${d.name}`));
        } else {
            console.log(dm);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
