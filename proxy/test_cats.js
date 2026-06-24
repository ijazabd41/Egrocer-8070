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
        const cats = await get('/api/bcd-website-category?by_AJR=1');
        console.log("Categories:");
        if (cats.data) {
            cats.data.slice(0, 10).forEach(c => console.log(`  ID: ${c.id}, Name: ${c.name}`));
        } else {
            console.log(cats);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
