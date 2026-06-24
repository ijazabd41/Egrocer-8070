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
        const u = await get('/api/delivery-management?by_AJR=1&limit=2');
        console.log(JSON.stringify(u, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
