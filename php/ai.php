<?php
// RU: Читаем тело запроса до session_start чтобы не потерять данные
// DE: Anfrage-Body vor session_start lesen, damit die Daten nicht verloren gehen
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

session_start();

// RU: Говорим браузеру что возвращаем JSON
// DE: Browser mitteilen, dass wir JSON zurückgeben
header('Content-Type: application/json');

// RU: Подключаем базу данных и сессию
// DE: Datenbankverbindung und Session einbinden
require 'config.php';

// RU: Проверяем залогинен ли пользователь
// DE: Prüfen ob der Benutzer eingeloggt ist
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// RU: Разрешаем только POST запросы
// DE: Nur POST-Anfragen erlauben
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// RU: Берём API ключ Groq из переменных окружения
// DE: Groq API-Schlüssel aus den Umgebungsvariablen holen
$apiKey = getenv('GROQ_API_KEY');

if (!$apiKey) {
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

// RU: Берём историю сообщений из запроса
// DE: Nachrichtenverlauf aus der Anfrage holen
$messages = $data['messages'] ?? [];

if (empty($messages)) {
    echo json_encode(['error' => 'No messages']);
    exit;
}

// RU: Формируем запрос к Groq API с моделью llama
// DE: Anfrage an die Groq API mit dem llama-Modell erstellen
$payload = json_encode([
    'model' => 'llama-3.3-70b-versatile',
    'messages' => $messages,
    'max_tokens' => 400,
    'temperature' => 0.7
]);

// RU: Отправляем запрос к Groq через curl
// DE: Anfrage über curl an Groq senden
$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

// RU: Получаем и парсим ответ
// DE: Antwort empfangen und parsen
$response = curl_exec($ch);
$result = json_decode($response, true);
$reply = $result['choices'][0]['message']['content'] ?? 'No response';

echo json_encode(['reply' => $reply]);
?>