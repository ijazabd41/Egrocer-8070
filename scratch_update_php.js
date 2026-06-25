const fs = require('fs');
let proxyPhp = fs.readFileSync('website/proxy.php', 'utf8');

// Add require_once config.php
if (!proxyPhp.includes('require_once __DIR__ . \'/config.php\';')) {
    proxyPhp = proxyPhp.replace("header('Access-Control-Allow-Origin: *');", "require_once __DIR__ . '/config.php';\nheader('Access-Control-Allow-Origin: *');");
}

// Replace targetUrl
proxyPhp = proxyPhp.replace("$targetUrl = 'http://cooperp.freeddns.org:8070' . $pathInfo;", "$targetUrl = $ODOO_BASE_URL . $pathInfo;");

fs.writeFileSync('website/proxy.php', proxyPhp, 'utf8');

// Now update bridge config.php
let mainConfig = fs.readFileSync('website/config.php', 'utf8');
fs.writeFileSync('website/coop_telr_website_bridge/config.php', mainConfig, 'utf8');
