<?php
require_once "../config/voucherDataHandler.php";

class VoucherLogic {
    private $dh;

    public function __construct() {
        $this->dh = new VoucherDataHandler();
    }

    public function handleRequest($method, $data = [], $files = []) {
        switch ($method) {
            case "generateUniqueCode":
                return $this->dh->generateUniqueCode();

            case "createVoucher":
                return $this->dh->createVoucher($data);

            case "getAllVouchers":
                return $this->dh->getAllVouchers();

            default:
                return ["success" => false, "message" => "Method not allowed"];
        }
    }
}