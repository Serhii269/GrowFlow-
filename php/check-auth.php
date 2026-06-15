<?php
$raw = file_get_contents('php://input');

session_start();
header('Content-Type: application/json');

require 'config.php';

if (isset($_SESSION['user_id'])) {
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
    echo json_encode(['logged_in' => false]);
}
?>