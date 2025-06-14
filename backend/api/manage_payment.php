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

if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['reservation_id'], $data['action'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$reservationId = (int)$data['reservation_id'];
$action = $data['action'];

// Validate payment reference for confirm action
if ($action === 'confirm') {
    if (!isset($data['payment_reference']) || empty(trim($data['payment_reference']))) {
        echo json_encode(['success' => false, 'error' => 'Payment reference is required']);
        exit;
    }
    $paymentReference = trim($data['payment_reference']);
}

if ($action === 'confirm') {
    $stmt = $conn->prepare("UPDATE reservations SET payment_status = 'confirmed', payment_reference = ? WHERE id = ?");
    $stmt->bind_param("si", $paymentReference, $reservationId);
} elseif ($action === 'cancel') {
    $stmt = $conn->prepare("UPDATE reservations SET payment_status = 'cancelled', payment_reference = NULL WHERE id = ?");
    $stmt->bind_param("i", $reservationId);
} else {
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
    exit;
}

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Failed to prepare statement']);
    exit;
}

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to update payment status: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
