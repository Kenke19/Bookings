<?php
header("Content-Type: application/json");
require_once 'db.php';

// Start session and check authentication
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

try {
    // Use the SAME session keys as login.php
    $user_id = $_SESSION['user_id'];
    $user_role = strtolower($_SESSION['user_role'] ?? ''); // Force lowercase for consistency
    
    // For admin: get all users except self
    // For regular users: get only admin users
    $query = ($user_role === 'admin')
        ? "SELECT id, name, email, role FROM users WHERE id != ? ORDER BY name ASC"
        : "SELECT id, name, email, role FROM users WHERE role = 'admin' AND id != ? ORDER BY name ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id); // Use $user_id (matches login.php's session key)
    $stmt->execute();
    $users = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>