<?php
require_once __DIR__ . '/config.php';
$token = $_GET['token'] ?? basename($_SERVER['REQUEST_URI']);
if (!$token) { die('Invalid payment link'); }

$ch = curl_init($ODOO_BASE_URL . '/coop_wa/payment/' . urlencode($token));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['X-API-Key: ' . $ODOO_API_KEY],
    CURLOPT_TIMEOUT => 30,
]);
$res = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($http !== 200) { die('Unable to fetch order details'); }
$order = json_decode($res, true);
if (!$order || empty($order['amount'])) { die('Invalid order response'); }

$amount = number_format((float)$order['amount'], 2, '.', '');
$orderRef = $order['order_ref'] ?? ('WA-' . time());
$name = $order['customer_name'] ?? 'Customer';
$email = $order['customer_email'] ?? 'customer@coop-discounts.com';
$phone = $order['customer_mobile'] ?? '';

$telrUrl = $TELR_TEST_MODE ? 'https://secure.telr.com/gateway/order.json' : 'https://secure.telr.com/gateway/order.json';
$payload = [
    'method' => 'create',
    'store' => $TELR_STORE_ID,
    'authkey' => $TELR_AUTH_KEY,
    'order' => [
        'cartid' => $orderRef,
        'test' => $TELR_TEST_MODE ? '1' : '0',
        'amount' => $amount,
        'currency' => $CURRENCY,
        'description' => 'WhatsApp Order ' . $orderRef,
    ],
    'return' => [
        'authorised' => $SITE_BASE_URL . '/payment/telr/success.php?token=' . urlencode($token),
        'declined'   => $SITE_BASE_URL . '/payment/telr/decline.php?token=' . urlencode($token),
        'cancelled'  => $SITE_BASE_URL . '/payment/telr/cancel.php?token=' . urlencode($token),
    ],
    'customer' => [
        'name' => [ 'forenames' => $name, 'surname' => '' ],
        'email' => $email,
        'phone' => $phone,
    ],
];

$ch = curl_init($telrUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 30,
]);
$telrRes = curl_exec($ch);
$telrHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$data = json_decode($telrRes, true);
$url = $data['order']['url'] ?? null;
if (!$url) { echo '<pre>Telr error: '; print_r($data); echo '</pre>'; exit; }
header('Location: ' . $url);
exit;
