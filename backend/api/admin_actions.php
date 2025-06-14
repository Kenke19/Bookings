<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once 'db.php';
require_once 'mailer.php';

if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['action'], $data['reservation_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

$reservation_id = (int)$data['reservation_id'];
$action = $data['action'];

// Get reservation details including email
$stmt = $conn->prepare("SELECT id, email, date, amount, status FROM reservations WHERE id = ?");
$stmt->bind_param("i", $reservation_id);
$stmt->execute();
$reservation = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$reservation) {
    echo json_encode(['success' => false, 'error' => 'Reservation not found']);
    exit;
}

if ($reservation['status'] === 'cancelled' || $reservation['status'] === 'completed') {
    echo json_encode([
        'success' => false,
        'error' => 'This reservation is already cancelled or completed and cannot be changed.'
    ]);
    exit;
}

switch ($action) {
    case 'confirm_reservation':
        $new_status = 'confirmed';
        break;
    case 'cancel_reservation':
        $new_status = 'cancelled';
        break;
    case 'complete_reservation':
        $new_status = 'completed';
        break;
    default:
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
        exit;
}

// Update reservation status
$stmt = $conn->prepare("UPDATE reservations SET status = ? WHERE id = ?");
$stmt->bind_param("si", $new_status, $reservation_id);
$db_success = $stmt->execute();
$stmt->close();

if ($db_success) {
    $email_sent = false;
    
    if (in_array($new_status, ['confirmed', 'cancelled'])) {
        // Get user's name from users table
        $user_stmt = $conn->prepare("SELECT name FROM users WHERE email = ?");
        $user_stmt->bind_param("s", $reservation['email']);
        $user_stmt->execute();
        $user = $user_stmt->get_result()->fetch_assoc();
        $user_stmt->close();
        
        // Fallback if user not found
        $user_name = $user['name'] ?? 'Valued Customer';
        
        $subject = ($new_status === 'confirmed') 
            ? "Reservation Confirmed #$reservation_id" 
            : "Reservation Cancelled #$reservation_id";
        
        $body = ($new_status === 'confirmed')
            ? "<h2 style='color:#1976d2;'>🎉 Booking Confirmed</h2>
        <p>Hi <strong>$user_name</strong>,</p>
        <p>Your reservation <strong>#$reservation_id</strong> for <strong>{$reservation['date']}</strong> has been <span style='color:#1976d2;font-weight:600;'>confirmed</span>.</p>
        <p>We look forward to serving you. If you have any questions or need to make changes, just reply to this email.</p>
        <p style='margin-top:2em;'>Thank you for choosing us!<br><strong>The Bookings Team</strong></p>"
    : "<h2 style='color:#d32f2f;'>Booking Cancelled</h2>
        <p>Hi <strong>$user_name</strong>,</p>
        <p>Your reservation <strong>#$reservation_id</strong> for <strong>{$reservation['date']}</strong> has been <span style='color:#d32f2f;font-weight:600;'>cancelled</span>.</p>
        <p>If you have any questions or think this was a mistake, please contact us and we’ll be happy to help.</p>
        <p style='margin-top:2em;'>Best regards,<br><strong>The Bookings Team</strong></p>";
        
        $email_sent = sendNotificationEmail($reservation['email'], $subject, $body);
        error_log("Email to {$reservation['email']}: " . ($email_sent ? 'Sent' : 'Failed'));
    }

    echo json_encode([
        'success' => true,
        'email_sent' => $email_sent
    ]);
} else {
    echo json_encode(['success' => false, 'error' => $conn->error]);
}

$conn->close();
?>