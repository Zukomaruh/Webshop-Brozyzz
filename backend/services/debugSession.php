<?php
session_start();
header('Content-Type: application/json');

$debug = [
    "session_id" => session_id(),
    "session_status" => session_status(), // 2 bedeutet aktiv
    "data" => $_SESSION,
    "cookie_name" => session_name()
];

echo json_encode($debug, JSON_PRETTY_PRINT);