const http = require('http');

async function testApi() {
  try {
    const loginRes = await fetch("http://localhost:3001/proxy/web/session/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        params: { db: "staging-apr17", login: "storekeeper2@eicoop.ae1", password: "dds@123" }
      })
    });
    
    const sessionToken = loginRes.headers.get("x-set-session-token");
    console.log("Session token:", sessionToken ? "Found" : "Not Found");
    if (!sessionToken) return;

    const dashRes = await fetch("http://localhost:3001/proxy/api/stock/dashboard?by_AJR=1&period=all", {
      headers: { "Content-Type": "application/json", "X-Session-Token": sessionToken }
    });
    const text = await dashRes.text();
    console.log("Raw response (first 500 chars):", text.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}
testApi();
