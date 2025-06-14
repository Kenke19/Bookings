<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'db.php';
require_once 'mailer.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['email'], $data['date'], $data['amount'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        exit;
    }

    $email = $data['email'];
    $date = $data['date'];
    $amount = (int) $data['amount'];
    $status = 'pending';
    $payment_status = 'pending';

    $stmt = $conn->prepare("INSERT INTO reservations ( email, date, amount, status, payment_status) VALUES (?, ?, ?, ?, ?)");
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }

    $stmt->bind_param("ssiss", $email, $date, $amount, $status, $payment_status);

    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'error' => $stmt->error]);
        exit;
    }

    echo json_encode(['success' => true, 'reservation_id' => $conn->insert_id]);

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
}
?>
