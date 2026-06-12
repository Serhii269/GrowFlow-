<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

$databaseUrl = getenv('DATABASE_URL');

if ($databaseUrl) {
    $parsed = parse_url($databaseUrl);
    $host = $parsed['host'];
    $port = $parsed['port'] ?? 5432;
    $name = ltrim($parsed['path'], '/');
    $user = $parsed['user'];
    $pass = $parsed['pass'];
} else {
    $host = getenv('DB_HOST') ?: 'localhost';
    $port = getenv('DB_PORT') ?: '5432';
    $name = getenv('DB_NAME') ?: 'growflow';
    $user = getenv('DB_USER') ?: 'sergijpidgorodeckij';
    $pass = getenv('DB_PASS') ?: '';
}

try {
    $pdo = new PDO(
        "pgsql:host={$host};port={$port};dbname={$name}",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    die(json_encode(['error' => 'Database connection failed']));
}
?>