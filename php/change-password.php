<?php
// RU: Читаем тело запроса
// DE: Anfrage-Body lesen
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

// RU: Берём текущий и новый пароль из запроса
// DE: Aktuelles und neues Passwort aus der Anfrage holen
$current = $data['current'] ?? '';
$newPass = $data['newPass'] ?? '';

session_start();
header('Content-Type: application/json');
require 'config.php';

// RU: Проверяем авторизацию
// DE: Autorisierung prüfen
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// RU: Получаем хэш текущего пароля из базы
// DE: Aktuellen Passwort-Hash aus der Datenbank holen
$stmt = $pdo->prepare('SELECT password FROM users WHERE id = :id');
$stmt->execute([':id' => $_SESSION['user_id']]);
$user = $stmt->fetch();

// RU: Проверяем правильность текущего пароля
// DE: Richtigkeit des aktuellen Passworts prüfen
if (!password_verify($current, $user['password'])) {
    echo json_encode(['error' => 'Current password is incorrect']);
    exit;
}

// RU: Хэшируем новый пароль и обновляем в базе
// DE: Neues Passwort hashen und in der Datenbank aktualisieren
$hash = password_hash($newPass, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE users SET password = :password WHERE id = :id');
$stmt->execute([':password' => $hash, ':id' => $_SESSION['user_id']]);

echo json_encode(['success' => true]);
?>