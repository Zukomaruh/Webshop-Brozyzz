<?php
session_start();
require_once "voucherLogic.php";

// Sicherheits-Guard: Nur Admins dürfen diesen Handler ansteuern
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Access denied. Admins only.']);
    exit();
}

$method = $_POST["method"] ?? $_GET["method"] ?? "";
$data = array_merge($_GET, $_POST);

$logic = new VoucherLogic();
$result = $logic->handleRequest($method, $data, $_FILES);

header('Content-Type: application/json');
echo json_encode($result);