<?php
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

session_start();
header('Content-Type: application/json');

require 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$apiKey = getenv('GROQ_API_KEY');

if (!$apiKey) {
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

$messages = $data['messages'] ?? [];

if (empty($messages)) {
    echo json_encode(['error' => 'No messages']);
    exit;
}

$payload = json_encode([
    'model' => 'llama-3.3-70b-versatile',
    'messages' => $messages,
    'max_tokens' => 400,
    'temperature' => 0.7
]);

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

$response = curl_exec($ch);
$result = json_decode($response, true);
$reply = $result['choices'][0]['message']['content'] ?? 'No response';

echo json_encode(['reply' => $reply]);
?>