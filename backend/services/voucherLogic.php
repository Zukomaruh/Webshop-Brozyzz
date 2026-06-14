<?php
// Wir benötigen beide DataHandler, da wir Gutscheindaten prüfen und Userdaten aktualisieren müssen!
require_once "../config/voucherDataHandler.php";
require_once "../config/userDataHandler.php"; //Damit wir Zugriff auf addToUserBalance() haben

class VoucherLogic {
    private $voucherDh;
    private $userDh;

    public function __construct() {
        $this->voucherDh = new VoucherDataHandler();
        $this->userDh = new UserDataHandler(); //Instanziierung des User-DataHandlers
    }

    public function handleRequest($method, $data = [], $files = []) {
        // Sicherheits-Check: Admin-Methoden schützen
        $adminMethods = ["generateUniqueCode", "createVoucher", "getAllVouchers"];
        if (in_array($method, $adminMethods)) {
            if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
                return ["success" => false, "message" => "Access denied. Admins only."];
            }
        }

        // Sicherheits-Check: Nur eingeloggte Kunden dürfen Gutscheine einlösen
        if ($method === "redeemVoucher") {
            if (!isset($_SESSION['user_id'])) {
                return ["success" => false, "message" => "Please log in to use a voucher."];
            }
        }

        switch ($method) {
            case "generateUniqueCode":
                return $this->voucherDh->generateUniqueCode();
            case "createVoucher":
                return $this->voucherDh->createVoucher($data);
            case "getAllVouchers":
                return $this->voucherDh->getAllVouchers();

            case "redeemVoucher":
                // 1. SCHRITT: Gutschein-Gültigkeit in der DB prüfen
                $code = $data["code"] ?? "";
                $voucherCheck = $this->voucherDh->verifyAndGetVoucher($code);

                // Wenn der Gutschein ungültig, abgelaufen oder bereits benutzt ist -> sofort abbrechen
                if (!$voucherCheck['success']) {
                    return $voucherCheck;
                }

                $voucherValue = (float)$voucherCheck['value'];
                $userId = $_SESSION['user_id'];

                // 2. SCHRITT: Den Gutschein-Wert sofort auf das Konto des Users buchen
                // Hier nutzen wir deine bereits existierende Funktion aus dem UserDataHandler!
                $balanceUpdated = $this->userDh->addToUserBalance($userId, $voucherValue);

                if (!$balanceUpdated) {
                    return ["success" => false, "message" => "Critical Error: Could not update your account balance."];
                }

                // 3. SCHRITT: Gutschein als verbraucht/eingelöst markieren (is_redeemed = 1)
                $markedAsRedeemed = $this->voucherDh->markAsRedeemed($code);

                if (!$markedAsRedeemed) {
                    // Falls das Markieren schiefgeht, loggen wir das zur Sicherheit für den Admin
                    error_log("Warning: Voucher $code was added to User $userId but could not be marked as redeemed in DB!");
                }

                // 4. SCHRITT: Erfolgsmeldung vorbereiten und die NEUE Gesamt-Balance des Users holen
                $updatedUserProfile = $this->userDh->getUserById($userId);
                $newBalance = $updatedUserProfile ? (float)$updatedUserProfile['balance'] : $voucherValue;

                return [
                    "success" => true,
                    "message" => "Successfully redeemed! " . number_format($voucherValue, 2) . " € added to your account.",
                    "newBalance" => $newBalance // Schicken wir ans Frontend, damit die UI sich sofort aktualisiert
                ];

            default:
                return ["success" => false, "message" => "Method not allowed"];
        }
    }
}