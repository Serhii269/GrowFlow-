<?php
// RU: Читаем тело запроса до session_start
// DE: Anfrage-Body vor session_start lesen
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

// RU: Берём email и пароль из запроса
// DE: E-Mail und Passwort aus der Anfrage holen
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

// RU: Ищем пользователя по email в базе
// DE: Benutzer anhand der E-Mail in der Datenbank suchen
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

// RU: Проверяем пароль через password_verify
// DE: Passwort mit password_verify prüfen
if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode(['error' => 'Incorrect email or password']);
    exit;
}

// RU: Сохраняем данные пользователя в сессии
// DE: Benutzerdaten in der Sitzung speichern
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];

echo json_encode(['success' => true, 'name' => $user['name']]);
?>