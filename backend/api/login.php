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

error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();
require_once 'db.php';
require_once 'mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

// Handle forgot password request
if (isset($data['forgot_password']) && $data['forgot_password'] === true) {
    if (empty($data['email'])) {
        echo json_encode(['success' => false, 'error' => 'Email is required']);
        exit;
    }

    // Check if email exists (without revealing existence)
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $data['email']);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        // Generate token
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiration
        
        // Store token in database
        $update = $conn->prepare("UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?");
        $update->bind_param("sss", $token, $expires, $data['email']);
        
        if ($update->execute()) {
            // Send email
            $resetLink = "http://localhost:5173/reset-password?token=$token";
            $emailSent = sendNotificationEmail(
                $data['email'],
                'Password Reset Request',
                "Click this link to reset your password: <a href='$resetLink'>Reset Password</a>"
            );
            
            if (!$emailSent) {
                error_log("Failed to send reset email to: " . $data['email']);
            }
        }
    }

    // Always return success to prevent email enumeration
    echo json_encode([
        'success' => true,
        'message' => 'If an account exists with this email, a reset link has been sent'
    ]);
    exit;
}

// Handle normal login
if (empty($data['email']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'error' => 'Email and password are required']);
    exit;
}

$email = $data['email'];
$password = $data['password'];

$stmt = $conn->prepare("SELECT id, name, password_hash, role FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    exit;
}

$stmt->bind_result($id, $name, $password_hash, $role);
$stmt->fetch();

if (password_verify($password, $password_hash)) {
    $_SESSION['user_id'] = $id;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_role'] = $role;
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'role' => $role,
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
}

$stmt->close();
$conn->close();
?>