<?php
// RU: Запускаем сессию только если она ещё не запущена
// DE: Sitzung nur starten wenn sie noch nicht gestartet wurde
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// RU: Заголовки безопасности
// DE: Sicherheits-Header
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// RU: Проверяем есть ли переменная DATABASE_URL (для Render/Railway)
// DE: Prüfen ob die Variable DATABASE_URL vorhanden ist (für Render/Railway)
$databaseUrl = getenv('DATABASE_URL');

if ($databaseUrl) {
    // RU: Парсим строку подключения из облачного хостинга
    // DE: Verbindungsstring vom Cloud-Hosting parsen
    $dbParsed = parse_url($databaseUrl);
    $dbHost = $dbParsed['host'];
    $dbPort = $dbParsed['port'] ?? 5432;
    $dbName = ltrim($dbParsed['path'], '/');
    $dbUser = $dbParsed['user'];
    $dbPass = $dbParsed['pass'];
} else {
    // RU: Используем локальные переменные из .env файла
    // DE: Lokale Variablen aus der .env-Datei verwenden
    $dbHost = getenv('DB_HOST') ?: 'localhost';
    $dbPort = getenv('DB_PORT') ?: '5432';
    $dbName = getenv('DB_NAME') ?: 'growflow';
    $dbUser = getenv('DB_USER') ?: 'sergijpidgorodeckij';
    $dbPass = getenv('DB_PASS') ?: '';
}

try {
    // RU: Подключаемся к PostgreSQL через PDO с SSL
    // DE: Mit PostgreSQL über PDO mit SSL verbinden
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
    // RU: Если подключение не удалось — возвращаем ошибку
    // DE: Wenn die Verbindung fehlschlägt — Fehler zurückgeben
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
?>