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
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['reference'], $data['reservation_id'])) {
        echo json_encode(['success' => false, 'error' => 'Missing reference or reservation_id']);
        exit;
    }
    $reference = $data['reference'];
    $reservation_id = $data['reservation_id'];

    $curl = curl_init();

    curl_setopt_array($curl, array(
        CURLOPT_URL => "https://api.paystack.co/transaction/verify/" . $reference,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer sk_test_accc9dcbc89207840a4600a269e0c47e1b53d122"
        ],
    ));

    $response = curl_exec($curl);
    curl_close($curl);

    $result = json_decode($response, true);

    if (!empty($result['status']) && !empty($result['data']['status']) && $result['data']['status'] === 'success') {
        $stmt = $conn->prepare("UPDATE reservations SET payment_status='pending', status='pending', payment_reference = ? WHERE id = ?");
        $stmt->bind_param("si", $reference, $reservation_id);
        $stmt->execute();
        $stmt->close();

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Payment verification failed']);
    }
}
?>
