<?php
// telr-proxy.php
// A simple PHP proxy to forward requests to the Telr API and bypass CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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

// Safe URL parsing from REQUEST_URI without Apache URL-decoding
$uri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($uri);
$path = isset($parsedUrl['path']) ? $parsedUrl['path'] : '';
$prefix = '/telr-proxy.php';
$pos = strpos($path, $prefix);
if ($pos !== false) {
    $pathInfo = substr($path, $pos + strlen($prefix));
} else {
    $pathInfo = $path; // Fallback
}

$targetUrl = 'https://secure.telr.com' . $pathInfo;
if (!empty($_SERVER['QUERY_STRING'])) {
    $targetUrl .= '?' . $_SERVER['QUERY_STRING'];
}

$ch = curl_init($targetUrl);

// Forward request method and body
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

// Forward headers
$headers = array();
foreach (getallheaders() as $name => $value) {
    $lowerName = strtolower($name);
    if ($lowerName !== 'host' && $lowerName !== 'content-length' && $lowerName !== 'connection' && $lowerName !== 'accept-encoding') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_ENCODING, ""); // Automatically handle gzip/deflate decoding
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For compatibility with some shared hosts

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
