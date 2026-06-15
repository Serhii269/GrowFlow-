<?php
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
error_log("REGISTER DATA: " . print_r($data, true));
error_log("NAME: " . ($data['name'] ?? 'EMPTY'));

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

session_start();
header('Content-Type: application/json');

require 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!$name || !$email || !$password) {
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['error' => 'Password must be at least 6 characters']);
    exit;
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$stmt->execute([':email' => $email]);
if ($stmt->fetch()) {
    echo json_encode(['error' => 'Email already registered']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password) VALUES (:name, :email, :password) RETURNING id');
$stmt->execute([':name' => $name, ':email' => $email, ':password' => $hash]);
$user = $stmt->fetch();

error_log("INSERTED: " . print_r($user, true));
error_log("NAME WAS: " . $name);

$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $name;
$_SESSION['user_email'] = $email;

echo json_encode(['success' => true, 'name' => $name]);
?>