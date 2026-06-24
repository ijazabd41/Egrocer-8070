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
        const u = await get('/api/rider-delivery?by_AJR=1&limit=1');
        console.log("Delivery:");
        if (u.data && u.data.length > 0) {
            const id = u.data[0].id;
            console.log("ID:", id);
            const d = await get(`/api/rider-delivery/${id}?by_AJR=1`);
            console.log(JSON.stringify(d, null, 2));
        } else {
            console.log(u);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
