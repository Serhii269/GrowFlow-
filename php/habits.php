<?php
// RU: Устанавливаем заголовок JSON ответа
// DE: JSON-Antwort-Header setzen
header('Content-Type: application/json');

// RU: Читаем тело запроса
// DE: Anfrage-Body lesen
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

// RU: Подключаем конфигурацию базы данных и сессию
// DE: Datenbankkonfiguration und Session einbinden
require 'config.php';

// RU: Проверяем залогинен ли пользователь
// DE: Prüfen ob der Benutzer eingeloggt ist
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// RU: GET запрос — возвращаем все привычки пользователя
// DE: GET-Anfrage — alle Gewohnheiten des Benutzers zurückgeben
if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT * FROM habits WHERE user_id = :user_id ORDER BY created_at DESC');
    $stmt->execute([':user_id' => $userId]);
    $habits = $stmt->fetchAll();

    foreach ($habits as &$habit) {
        $today = date('Y-m-d');

        // RU: Проверяем выполнена ли привычка сегодня
        // DE: Prüfen ob die Gewohnheit heute erledigt wurde
        $logStmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM habit_logs WHERE habit_id = :id AND completed_at = :today');
        $logStmt->execute([':id' => $habit['id'], ':today' => $today]);
        $habit['done_today'] = $logStmt->fetch()['cnt'] > 0;

        // RU: Считаем общее количество выполнений
        // DE: Gesamtanzahl der Erledigungen zählen
        $totalStmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM habit_logs WHERE habit_id = :id');
        $totalStmt->execute([':id' => $habit['id']]);
        $habit['total_completions'] = (int)$totalStmt->fetch()['cnt'];

        // RU: Берём дату последнего выполнения
        // DE: Datum der letzten Erledigung holen
        $lastStmt = $pdo->prepare('SELECT MAX(completed_at) as last FROM habit_logs WHERE habit_id = :id');
        $lastStmt->execute([':id' => $habit['id']]);
        $habit['last_completed'] = $lastStmt->fetch()['last'];

        // RU: Вызываем PostgreSQL функцию для подсчёта streak (серии дней подряд)
        // DE: PostgreSQL-Funktion aufrufen um die Streak (aufeinanderfolgende Tage) zu berechnen
        $streakStmt = $pdo->prepare('SELECT get_streak(:id) as streak');
        $streakStmt->execute([':id' => $habit['id']]);
        $row = $streakStmt->fetch();
        $habit['streak'] = (int)($row['streak'] ?? 0);

        // RU: Получаем подцели для каждой привычки
        // DE: Teilziele für jede Gewohnheit holen
        $subtaskStmt = $pdo->prepare('SELECT * FROM habit_subtasks WHERE habit_id = :id ORDER BY position');
        $subtaskStmt->execute([':id' => $habit['id']]);
        $habit['subtasks'] = $subtaskStmt->fetchAll();
    }

    // RU: Находим максимальный streak среди всех привычек
    // DE: Maximale Streak unter allen Gewohnheiten finden
    $maxStreak = max(array_merge([0], array_column($habits, 'streak')));

    echo json_encode([
        'habits' => $habits,
        'max_streak' => $maxStreak
    ]);
    exit;
}

// RU: POST запрос — создание, выполнение или удаление привычки
// DE: POST-Anfrage — Gewohnheit erstellen, erledigen oder löschen
if ($method === 'POST') {
    $action = $data['action'] ?? '';

    // RU: Создаём новую привычку
    // DE: Neue Gewohnheit erstellen
    if ($action === 'create') {
        $name = trim($data['name'] ?? '');
        $icon = $data['icon'] ?? 'book-open';
        $plant = $data['plant'] ?? 'sprout';
        $plantName = $data['plant_name'] ?? 'Sprout';
        $deadline = $data['deadline'] ?? null;
        $subtasks = $data['subtasks'] ?? [];

        if (!$name) { echo json_encode(['error' => 'Name required']); exit; }

        // RU: Вставляем привычку в базу и получаем её ID
        // DE: Gewohnheit in die Datenbank einfügen und ID zurückbekommen
        $stmt = $pdo->prepare('INSERT INTO habits (user_id, name, icon, plant, plant_name, deadline) VALUES (:user_id, :name, :icon, :plant, :plant_name, :deadline) RETURNING id');
        $stmt->execute([
            ':user_id' => $userId,
            ':name' => $name,
            ':icon' => $icon,
            ':plant' => $plant,
            ':plant_name' => $plantName,
            ':deadline' => $deadline ?: null
        ]);
        $habit = $stmt->fetch();
        $habitId = $habit['id'];

        // RU: Сохраняем подцели если они есть
        // DE: Teilziele speichern falls vorhanden
        foreach ($subtasks as $i => $title) {
            $title = trim($title);
            if (!$title) continue;
            $pdo->prepare('INSERT INTO habit_subtasks (habit_id, title, position) VALUES (:hid, :title, :pos)')
                ->execute([':hid' => $habitId, ':title' => $title, ':pos' => $i]);
        }

        echo json_encode(['success' => true, 'id' => $habitId]);
        exit;
    }

    // RU: Отмечаем привычку выполненной или снимаем отметку
    // DE: Gewohnheit als erledigt markieren oder Markierung entfernen
    if ($action === 'toggle') {
        $habitId = $data['habit_id'] ?? 0;
        $today = date('Y-m-d');

        // RU: Проверяем что привычка принадлежит этому пользователю
        // DE: Prüfen ob die Gewohnheit diesem Benutzer gehört
        $stmt = $pdo->prepare('SELECT id FROM habits WHERE id = :id AND user_id = :uid');
        $stmt->execute([':id' => $habitId, ':uid' => $userId]);
        if (!$stmt->fetch()) { echo json_encode(['error' => 'Not found']); exit; }

        // RU: Если уже выполнена — убираем, если нет — добавляем запись
        // DE: Falls bereits erledigt — entfernen, sonst — Eintrag hinzufügen
        $existing = $pdo->prepare('SELECT id FROM habit_logs WHERE habit_id = :id AND completed_at = :today');
        $existing->execute([':id' => $habitId, ':today' => $today]);

        if ($existing->fetch()) {
            $pdo->prepare('DELETE FROM habit_logs WHERE habit_id = :id AND completed_at = :today')
                ->execute([':id' => $habitId, ':today' => $today]);
            $done = false;
        } else {
            $pdo->prepare('INSERT INTO habit_logs (habit_id, completed_at) VALUES (:id, :today)')
                ->execute([':id' => $habitId, ':today' => $today]);
            $done = true;
        }

        echo json_encode(['success' => true, 'done' => $done]);
        exit;
    }

    // RU: Удаляем привычку и все связанные данные
    // DE: Gewohnheit und alle zugehörigen Daten löschen
    if ($action === 'delete') {
        $habitId = $data['habit_id'] ?? 0;
        $pdo->prepare('DELETE FROM habits WHERE id = :id AND user_id = :uid')
            ->execute([':id' => $habitId, ':uid' => $userId]);
        echo json_encode(['success' => true]);
        exit;
    }
}

// RU: Неизвестный запрос
// DE: Unbekannte Anfrage
echo json_encode(['error' => 'Invalid request']);
?>