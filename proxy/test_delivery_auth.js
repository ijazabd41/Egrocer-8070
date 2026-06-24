const http = require('http');
const DB = 'production';

function post(path, payload) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'cooperp.freeddns.org',
            port: 8070,
            path: path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ headers: res.headers, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

function get(path, cookie) {
    return new Promise((resolve, reject) => {
        http.get(`http://cooperp.freeddns.org:8070${path}`, { headers: { 'Cookie': cookie } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function run() {
    try {
        const auth = await post('/web/session/authenticate', {
            jsonrpc: '2.0',
            params: { db: DB, login: 'test80@gmail.com', password: '123' } // using rider account if possible, or any account
        });
        const cookie = auth.headers['set-cookie'] ? auth.headers['set-cookie'].join(';') : '';
        console.log("Logged in:", auth.body.result?.name);

        const list = await get('/api/rider-delivery?by_AJR=1&limit=1', cookie);
        if (list.data && list.data.length > 0) {
            const id = list.data[0].id;
            console.log("Delivery ID:", id);
            const detail = await get(`/api/rider-delivery/${id}?by_AJR=1`, cookie);
            console.log(JSON.stringify(detail, null, 2));
        } else {
            console.log("No deliveries found", list);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
