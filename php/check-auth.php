<?php
$raw = file_get_contents('php://input');

session_start();
header('Content-Type: application/json');

require 'config.php';

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'logged_in' => true,
        'user_id' => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'],
        'email' => $_SESSION['user_email']
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}
?>