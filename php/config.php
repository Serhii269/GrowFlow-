<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

$databaseUrl = getenv('DATABASE_URL');

if ($databaseUrl) {
    $dbParsed = parse_url($databaseUrl);
    $dbHost = $dbParsed['host'];
    $dbPort = $dbParsed['port'] ?? 5432;
    $dbName = ltrim($dbParsed['path'], '/');
    $dbUser = $dbParsed['user'];
    $dbPass = $dbParsed['pass'];
} else {
    $dbHost = getenv('DB_HOST') ?: 'localhost';
    $dbPort = getenv('DB_PORT') ?: '5432';
    $dbName = getenv('DB_NAME') ?: 'growflow';
    $dbUser = getenv('DB_USER') ?: 'sergijpidgorodeckij';
    $dbPass = getenv('DB_PASS') ?: '';
}

try {
    $pdo = new PDO(
        "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName};sslmode=require",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
?>