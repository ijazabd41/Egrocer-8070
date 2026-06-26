<?php
// telr-proxy.php — PHP production proxy for Telr Payment Gateway
// Mirrors the server.js /telr/* handler logic
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only POST is allowed (matches server.js restriction)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Only POST allowed for Telr proxy']);
    exit;
}

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            } else if ($name == "CONTENT_TYPE") {
                $headers["Content-Type"] = $value;
            } else if ($name == "CONTENT_LENGTH") {
                $headers["Content-Length"] = $value;
            }
        }
        return $headers;
    }
}

// ── PATH PARSING ─────────────────────────────────────────────────
$uri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($uri);
$path = isset($parsedUrl['path']) ? $parsedUrl['path'] : '';
$prefix = '/telr-proxy.php';
$pos = strpos($path, $prefix);
if ($pos !== false) {
    $pathInfo = substr($path, $pos + strlen($prefix));
} else {
    $pathInfo = $path;
}

// Ensure path starts with /
if (empty($pathInfo) || $pathInfo[0] !== '/') {
    $pathInfo = '/' . ltrim($pathInfo, '/');
}

$targetUrl = 'https://secure.telr.com' . $pathInfo;
if (!empty($_SERVER['QUERY_STRING'])) {
    $targetUrl .= '?' . $_SERVER['QUERY_STRING'];
}

// ── REQUEST ──────────────────────────────────────────────────────
$input = file_get_contents('php://input');

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($input)
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_ENCODING, ""); // Auto handle gzip/deflate
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // Keep SSL verification on in production
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// ── RESPONSE HEADERS ─────────────────────────────────────────────
$responseHeaders = [];
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$responseHeaders) {
    $len = strlen($header);
    $parts = explode(':', $header, 2);
    if (count($parts) < 2) return $len;
    $name = strtolower(trim($parts[0]));
    $responseHeaders[$name][] = trim($parts[1]);
    return $len;
});

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    curl_close($ch);
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['success' => 0, 'error' => 'Telr unreachable', 'detail' => curl_error($ch)]);
    exit;
}
curl_close($ch);

// Forward Telr's actual content-type (matches server.js)
$contentType = isset($responseHeaders['content-type']) ? $responseHeaders['content-type'][0] : 'application/json';
http_response_code($httpCode);
header('Content-Type: ' . $contentType);
echo $response;
?>
