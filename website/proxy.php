<?php
// proxy.php
// A simple PHP proxy to forward requests to the Odoo ERP and bypass CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the path requested after /proxy.php/
$pathInfo = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';
if (empty($pathInfo) && isset($_SERVER['ORIG_PATH_INFO'])) {
    $pathInfo = $_SERVER['ORIG_PATH_INFO'];
}
// Fallback
if (empty($pathInfo)) {
    $uri = $_SERVER['REQUEST_URI'];
    $parts = explode('proxy.php', $uri);
    if (count($parts) > 1) {
        $pathInfo = explode('?', $parts[1])[0];
    }
}

$targetUrl = 'http://cooperp.freeddns.org:8076' . $pathInfo;
if (!empty($_SERVER['QUERY_STRING'])) {
    $targetUrl .= '?' . $_SERVER['QUERY_STRING'];
}

$ch = curl_init($targetUrl);

$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

$headers = array();
foreach (getallheaders() as $name => $value) {
    $lowerName = strtolower($name);
    if ($lowerName !== 'host' && $lowerName !== 'content-length' && $lowerName !== 'connection') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    $httpCode = 500;
    $response = json_encode(['error' => 'Proxy cURL Error: ' . curl_error($ch)]);
}

curl_close($ch);

http_response_code($httpCode);
header('Content-Type: application/json');
echo $response;
?>
