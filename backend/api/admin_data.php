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

session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$type = $_GET['type'] ?? '';

switch ($type) {
    case 'users':
        $result = $conn->query("SELECT id, name, email, role, created_at FROM users");
        $data = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'users' => $data]);
        break;

    case 'reservations':
        $result = $conn->query("SELECT * FROM reservations ORDER BY created_at DESC");
        $data = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'reservations' => $data]);
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Invalid type parameter']);
        break;
}
