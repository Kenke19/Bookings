<?php
header("Content-Type: application/json");
require_once 'db.php'; // Uses your existing connection
require_once 'mailer.php'; // Include the PHPMailer setup

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];

// Get messages for current user
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_messages') {
    $stmt = $conn->prepare("
    SELECT 
        m.*, 
        sender.name as sender_name, sender.email as sender_email,
        receiver.name as receiver_name, receiver.email as receiver_email
    FROM messages m
    JOIN users sender ON m.sender_id = sender.id
    JOIN users receiver ON m.receiver_id = receiver.id
    WHERE m.receiver_id = ? OR m.sender_id = ?
    ORDER BY m.created_at DESC
");
$stmt->bind_param("ii", $userId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $messages = $result->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode(['success' => true, 'messages' => $messages]);
    exit;
}

// Send message with email notification
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'send_message') {
    // First store POST values in variables
    $receiver_id = $_POST['receiver_id'];
    $subject = isset($_POST['subject']) ? $_POST['subject'] : '';
    $message = $_POST['message'];
    
    // Get receiver's email
    $stmt = $conn->prepare("SELECT email, name FROM users WHERE id = ?");
    $stmt->bind_param("i", $receiver_id);
    $stmt->execute();
    $receiver = $stmt->get_result()->fetch_assoc();
    
    if (!$receiver) {
        echo json_encode(['success' => false, 'error' => 'Recipient not found']);
        exit;
    }
    
    // Store message in database
    $stmt = $conn->prepare("
        INSERT INTO messages 
        (sender_id, receiver_id, subject, message) 
        VALUES (?, ?, ?, ?)
    ");
    $stmt->bind_param("iiss", $userId, $receiver_id, $subject, $message);
    $dbSuccess = $stmt->execute();
    
    // Send email if database insert was successful
    $emailSuccess = false;
    if ($dbSuccess) {
        $emailSubject = "New Message: " . ($subject ?: 'No Subject');
        $emailBody = "
            <h2>You've received a new message</h2>
            <p><strong>From:</strong> Bookings.com </p>
            <p><strong>Subject:</strong> {$subject}</p>
            <p><strong>Message:</strong></p>
            <blockquote>{$message}</blockquote>
            <p>Please log in to your account to respond.</p>
        ";
        
        $emailSuccess = sendNotificationEmail(
            $receiver['email'], // Send to recipient's email from database
            $emailSubject,
            $emailBody
        );
    }
    
    echo json_encode([
        'success' => $dbSuccess,
        'email_sent' => $emailSuccess
    ]);
    exit;
}

// Mark as read
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'mark_as_read') {
    $message_id = $_POST['message_id'];
    
    $stmt = $conn->prepare("
        UPDATE messages 
        SET is_read = TRUE 
        WHERE id = ? AND receiver_id = ?
    ");
    $stmt->bind_param("ii", $message_id, $userId);
    $success = $stmt->execute();
    
    echo json_encode(['success' => $success]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid action']);
?>