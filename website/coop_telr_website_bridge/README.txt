Upload these files to your website public_html.

Required URL format:
https://coop-discounts.com/pay.php?token=TOKEN

If you want clean URL https://coop-discounts.com/pay/TOKEN add rewrite rule in .htaccess.

Edit config.php only:
- ODOO_BASE_URL
- ODOO_API_KEY
- TELR_STORE_ID
- TELR_AUTH_KEY
- TELR_TEST_MODE

Telr dashboard URLs:
Authorised: https://coop-discounts.com/payment/telr/success.php
Declined:   https://coop-discounts.com/payment/telr/decline.php
Cancelled:  https://coop-discounts.com/payment/telr/cancel.php
