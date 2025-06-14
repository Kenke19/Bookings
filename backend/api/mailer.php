<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Load PHPMailer
require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

// Shared mailer configuration
function setupMailer() {
    $mail = new PHPMailer(true);
    
    // Server settings (using your Gmail)
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'kenke2003@gmail.com';
    $mail->Password   = 'nlnuvkvcylzosshn'; // Your app password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    
    // Default from address
    $mail->setFrom('kenke2003@gmail.com', 'Booking System');
    
    return $mail;
}

// For sending 2FA codes
function send2FACode($email, $code) {
    $mail = setupMailer();
    
    try {
        $mail->addAddress($email);
        $mail->Subject = 'Your 2FA Verification Code';
        $mail->Body    = "
            <h2>Your Login Verification Code</h2>
            <p>Use this code to complete your login:</p>
            <div style='font-size:24px; font-weight:bold; color:#2563eb; margin:15px 0;'>
                {$code}
            </div>
            <p><em>This code expires in 10 minutes.</em></p>
            <p>If you didn't request this, please ignore this email.</p>
        ";
        $mail->isHTML(true);
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("2FA Email Error: {$mail->ErrorInfo}");
        return false;
    }
}

// For regular notifications
function sendNotificationEmail($to, $subject, $body) {
    $mail = setupMailer();
    
    try {
        $mail->addAddress($to);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags($body);
        $mail->isHTML(true);
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Notification Email Error: {$mail->ErrorInfo}");
        return false;
    }
}
?>