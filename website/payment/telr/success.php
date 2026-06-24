<?php require_once __DIR__ . '/../../config.php';
$token = $_GET['token'] ?? '';
$telrRef = $_GET['ref'] ?? ($_GET['orderref'] ?? '');
$payload = ['token'=>$token, 'status'=>'paid', 'telr_ref'=>$telrRef, 'currency'=>$CURRENCY];
$ch = curl_init($ODOO_BASE_URL . '/coop_wa/payment/update');
curl_setopt_array($ch, [CURLOPT_POST=>true, CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>['Content-Type: application/json','X-API-Key: '.$ODOO_API_KEY], CURLOPT_POSTFIELDS=>json_encode($payload), CURLOPT_TIMEOUT=>30]);
curl_exec($ch); curl_close($ch);
echo '<h2>Payment successful</h2><p>Your order has been received. You will get WhatsApp confirmation shortly.</p>';
