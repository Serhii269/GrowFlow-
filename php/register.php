<?php
// RU: Читаем тело запроса ПЕРВЫМ — до session_start и require
// DE: Anfrage-Body ZUERST lesen — vor session_start und require
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

// RU: Логи для отладки (можно удалить после тестирования)
// DE: Debug-Logs (können nach dem Testen gelöscht werden)
error_log("REGISTER DATA: " . print_r($data, true));
error_log("NAME: " . ($data['name'] ?? 'EMPTY'));

// RU: Берём данные из запроса
// DE: Daten aus der Anfrage holen
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

// RU: Проверяем что все поля заполнены
// DE: Prüfen ob alle Felder ausgefüllt sind
if (!$name || !$email || !$password) {
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

// RU: Проверяем формат email
// DE: E-Mail-Format prüfen
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

// RU: Пароль должен быть минимум 6 символов
// DE: Passwort muss mindestens 6 Zeichen lang sein
if (strlen($password) < 6) {
    echo json_encode(['error' => 'Password must be at least 6 characters']);
    exit;
}

// RU: Проверяем не занят ли email
// DE: Prüfen ob die E-Mail bereits vergeben ist
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$stmt->execute([':email' => $email]);
if ($stmt->fetch()) {
    echo json_encode(['error' => 'Email already registered']);
    exit;
}

// RU: Хэшируем пароль и сохраняем пользователя в базе
// DE: Passwort hashen und Benutzer in der Datenbank speichern
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password) VALUES (:name, :email, :password) RETURNING id');
$stmt->execute([':name' => $name, ':email' => $email, ':password' => $hash]);
$user = $stmt->fetch();

error_log("INSERTED: " . print_r($user, true));
error_log("NAME WAS: " . $name);

// RU: Сохраняем данные в сессии — пользователь сразу залогинен
// DE: Daten in der Sitzung speichern — Benutzer ist sofort eingeloggt
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $name;
$_SESSION['user_email'] = $email;

echo json_encode(['success' => true, 'name' => $name]);
?>