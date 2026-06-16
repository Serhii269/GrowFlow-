<?php
// RU: Запускаем сессию чтобы получить к ней доступ
// DE: Sitzung starten um darauf zugreifen zu können
session_start();
require 'config.php';

// RU: Уничтожаем сессию — пользователь выходит из аккаунта
// DE: Sitzung zerstören — Benutzer wird ausgeloggt
session_destroy();

// RU: Перенаправляем на главную страницу
// DE: Zur Startseite weiterleiten
header('Location: ../index.html');
exit;
?>