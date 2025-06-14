<?php
require 'mailer.php';

$test = sendNotificationEmail(
    'amanda4liquor@gmail.com', // Test with a known good address
    'TEST Email from System', 
    '<h1>This is a test</h1><p>If you get this, mailer works</p>'
);

echo $test ? "Email sent - check inbox" : "Failed: ".error_get_last()['message'];