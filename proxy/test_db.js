const http = require('http');

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://cooperp.freeddns.org:8070${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function postJSON(path, payload) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'cooperp.freeddns.org',
            port: 8070,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

async function run() {
    try {
        console.log("Databases (POST /web/database/list):");
        const list = await postJSON('/web/database/list', { params: {} });
        console.log(list);
    } catch (e) {
        console.error(e);
    }
}
run();
