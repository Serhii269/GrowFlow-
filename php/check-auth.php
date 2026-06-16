<?php
// RU: Читаем тело запроса
// DE: Anfrage-Body lesen
$raw = file_get_contents('php://input');

session_start();
header('Content-Type: application/json');
require 'config.php';

// RU: Проверяем есть ли активная сессия пользователя
// DE: Prüfen ob eine aktive Benutzersitzung vorhanden ist
if (isset($_SESSION['user_id'])) {

    // RU: Берём актуальное имя и email прямо из базы
    // DE: Aktuellen Namen und E-Mail direkt aus der Datenbank holen
    $stmt = $pdo->prepare('SELECT name, email FROM users WHERE id = :id');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();

    if ($user) {
        echo json_encode([
            'logged_in' => true,
            'user_id' => $_SESSION['user_id'],
            'name' => $user['name'],
            'email' => $user['email']
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
} else {
    // RU: Сессии нет — пользователь не залогинен
    // DE: Keine Sitzung — Benutzer ist nicht eingeloggt
    echo json_encode(['logged_in' => false]);
}
?>