<?php
// Enable strict error reporting
declare(strict_types=1);

// CORS headers must be at the very top, before any output
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header('Content-Type: application/json');

// Immediately handle OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Error reporting
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/php_errors.log');

require_once 'db.php';

try {
    // Handle GET request (token verification)
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['token'])) {
        $token = trim($_GET['token']);
        
        $stmt = $conn->prepare("SELECT email FROM users WHERE reset_token = ? AND reset_expires > NOW()");
        $stmt->bind_param("s", $token);
        
        if (!$stmt->execute()) {
            throw new Exception("Database query failed");
        }
        
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            header("Location: http://localhost:5173/reset-password?error=invalid_token");
            exit;
        }
        
        header("Location: http://localhost:5173/reset-password?token=" . urlencode($token));
        exit;
    }

    // Handle POST request (password reset)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        if (!$input) {
            throw new Exception("No input received");
        }
        
        $data = json_decode($input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON input");
        }
        
        if (empty($data['token']) || empty($data['new_password'])) {
            throw new Exception("Token and new password are required");
        }

        $token = trim($data['token']);
        $newPassword = trim($data['new_password']);
        
        if (strlen($newPassword) < 8) {
            throw new Exception("Password must be at least 8 characters");
        }

        $stmt = $conn->prepare("SELECT email FROM users WHERE reset_token = ? AND reset_expires > NOW()");
        $stmt->bind_param("s", $token);
        
        if (!$stmt->execute()) {
            throw new Exception("Token verification failed");
        }
        
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            throw new Exception("Invalid or expired token");
        }

        $user = $result->fetch_assoc();
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        
        $update = $conn->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE email = ?");
        $update->bind_param("ss", $newHash, $user['email']);
        
        if (!$update->execute()) {
            throw new Exception("Password update failed");
        }
        
        echo json_encode(['success' => true]);
        exit;
    }
    
    throw new Exception("Invalid request method");
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    exit;
}
?>