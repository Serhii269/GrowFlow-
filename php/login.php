<?php
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

session_start();
header('Content-Type: application/json');

require 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!$email || !$password) {
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode(['error' => 'Incorrect email or password']);
    exit;
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];

echo json_encode(['success' => true, 'name' => $user['name']]);
?>