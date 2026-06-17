const http = require('http');

async function testApi() {
  try {
    const tryLogins = [
      "storekeep2@eicoop.ae1",
      "storekeeper2@eicoop.ae",
      "storekeep2@eicoop.ae"
    ];
    let session = null;
    for (const login of tryLogins) {
      const loginRes = await fetch("http://localhost:3001/proxy/web/session/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          params: { db: "staging-apr17", login: login, password: "dds@123" }
        })
      });
      const loginData = await loginRes.json();
      if (loginData.result && loginData.result.session_id) {
        console.log("Login successful with:", login);
        session = loginData.result.session_id;
        break;
      } else {
        console.log("Login failed with:", login, loginData.error?.data?.message || loginData.error?.message);
      }
    }
    
    if (!session) {
        console.log("Could not login.");
        return;
    }

    const dashRes = await fetch("http://localhost:3001/proxy/api/stock/dashboard?by_AJR=1&period=all", {
      headers: { "Content-Type": "application/json", "X-Session-Token": session }
    });
    const dashData = await dashRes.json();
    console.log("Dashboard data keys:", Object.keys(dashData));
    if (dashData.store_keeper_queue) {
      console.log("Store keeper queue:", JSON.stringify(dashData.store_keeper_queue, null, 2).substring(0, 1000));
    } else {
      console.log("No store_keeper_queue in response.", JSON.stringify(dashData).substring(0, 500));
    }
  } catch (err) {
    console.error(err);
  }
}
testApi();
