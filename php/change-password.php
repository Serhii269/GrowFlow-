<?php
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$current = $data['current'] ?? '';
$newPass = $data['newPass'] ?? '';

session_start();
header('Content-Type: application/json');

require 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$stmt = $pdo->prepare('SELECT password FROM users WHERE id = :id');
$stmt->execute([':id' => $_SESSION['user_id']]);
$user = $stmt->fetch();

if (!password_verify($current, $user['password'])) {
    echo json_encode(['error' => 'Current password is incorrect']);
    exit;
}

$hash = password_hash($newPass, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE users SET password = :password WHERE id = :id');
$stmt->execute([':password' => $hash, ':id' => $_SESSION['user_id']]);

echo json_encode(['success' => true]);
?>