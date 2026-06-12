<?php
header('Content-Type: application/json');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

require 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT * FROM habits WHERE user_id = :user_id ORDER BY created_at DESC');
    $stmt->execute([':user_id' => $userId]);
    $habits = $stmt->fetchAll();

    foreach ($habits as &$habit) {
        $today = date('Y-m-d');

        $logStmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM habit_logs WHERE habit_id = :id AND completed_at = :today');
        $logStmt->execute([':id' => $habit['id'], ':today' => $today]);
        $habit['done_today'] = $logStmt->fetch()['cnt'] > 0;

        $totalStmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM habit_logs WHERE habit_id = :id');
        $totalStmt->execute([':id' => $habit['id']]);
        $habit['total_completions'] = (int)$totalStmt->fetch()['cnt'];

        $lastStmt = $pdo->prepare('SELECT MAX(completed_at) as last FROM habit_logs WHERE habit_id = :id');
        $lastStmt->execute([':id' => $habit['id']]);
        $habit['last_completed'] = $lastStmt->fetch()['last'];

        $streakStmt = $pdo->prepare('SELECT get_streak(:id) as streak');
        $streakStmt->execute([':id' => $habit['id']]);
        $row = $streakStmt->fetch();
        $habit['streak'] = (int)($row['streak'] ?? 0);

        $subtaskStmt = $pdo->prepare('SELECT * FROM habit_subtasks WHERE habit_id = :id ORDER BY position');
        $subtaskStmt->execute([':id' => $habit['id']]);
        $habit['subtasks'] = $subtaskStmt->fetchAll();
    }

    $maxStreak = max(array_merge([0], array_column($habits, 'streak')));

    echo json_encode([
        'habits' => $habits,
        'max_streak' => $maxStreak
    ]);
    exit;
}

if ($method === 'POST') {
    $action = $data['action'] ?? '';

    if ($action === 'create') {
        $name = trim($data['name'] ?? '');
        $icon = $data['icon'] ?? 'book-open';
        $plant = $data['plant'] ?? 'sprout';
        $plantName = $data['plant_name'] ?? 'Sprout';
        $deadline = $data['deadline'] ?? null;
        $subtasks = $data['subtasks'] ?? [];

        if (!$name) { echo json_encode(['error' => 'Name required']); exit; }

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

        foreach ($subtasks as $i => $title) {
            $title = trim($title);
            if (!$title) continue;
            $pdo->prepare('INSERT INTO habit_subtasks (habit_id, title, position) VALUES (:hid, :title, :pos)')
                ->execute([':hid' => $habitId, ':title' => $title, ':pos' => $i]);
        }

        echo json_encode(['success' => true, 'id' => $habitId]);
        exit;
    }

    if ($action === 'toggle') {
        $habitId = $data['habit_id'] ?? 0;
        $today = date('Y-m-d');

        $stmt = $pdo->prepare('SELECT id FROM habits WHERE id = :id AND user_id = :uid');
        $stmt->execute([':id' => $habitId, ':uid' => $userId]);
        if (!$stmt->fetch()) { echo json_encode(['error' => 'Not found']); exit; }

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

    if ($action === 'delete') {
        $habitId = $data['habit_id'] ?? 0;
        $pdo->prepare('DELETE FROM habits WHERE id = :id AND user_id = :uid')
            ->execute([':id' => $habitId, ':uid' => $userId]);
        echo json_encode(['success' => true]);
        exit;
    }
}

echo json_encode(['error' => 'Invalid request']);
?>