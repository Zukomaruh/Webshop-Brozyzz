<?php
require_once "../config/voucherDataHandler.php";

class VoucherLogic {
    private $dh;

    public function __construct() {
        $this->dh = new VoucherDataHandler();
    }

    public function handleRequest($method, $data = [], $files = []) {
        // Sicherheits-Check: Bestimmte Methoden dürfen weiterhin NUR Admins ausführen
        $adminMethods = ["generateUniqueCode", "createVoucher", "getAllVouchers"];
        if (in_array($method, $adminMethods)) {
            if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
                return ["success" => false, "message" => "Access denied. Admins only."];
            }
        }

      // Für die Kunden-Methode prüfen wir, ob überhaupt jemand eingeloggt ist
      if ($method === "redeemVoucher") {
          if (!isset($_SESSION['user_id'])) { // <--- Hier auf 'user_id' geändert!
              return ["success" => false, "message" => "Please log in to use a voucher."];
          }
      }

        switch ($method) {
            case "generateUniqueCode":
                return $this->dh->generateUniqueCode();

            case "createVoucher":
                return $this->dh->createVoucher($data);

            case "getAllVouchers":
                return $this->dh->getAllVouchers();

            case "redeemVoucher": // NEU: Für den Checkout-Prozess
                return $this->dh->verifyAndGetVoucher($data["code"] ?? "");

            default:
                return ["success" => false, "message" => "Method not allowed"];
        }
    }
}