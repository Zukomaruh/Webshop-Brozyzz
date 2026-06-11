<?php
require_once "dbaccess.php";

class VoucherDataHandler {
    private $db;

    public function __construct() {
        $dbAccess = new DBAccess();
        $this->db = $dbAccess->getConnection();
    }


    //Würfelt einen 5-stelligen Code und stellt sicher, dass er UNIQUE ist

    public function generateUniqueCode() {
        try {
            $codeIsUnique = false;
            $generatedCode = '';

            while (!$codeIsUnique) {
                $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                $generatedCode = '';
                for ($i = 0; $i < 5; $i++) {
                    $generatedCode .= $characters[rand(0, strlen($characters) - 1)];
                }

                $stmt = $this->db->prepare("SELECT COUNT(*) FROM vouchers WHERE code = :code");
                $stmt->execute([':code' => $generatedCode]);

                if ($stmt->fetchColumn() == 0) {
                    $codeIsUnique = true;
                }
            }

            return [
                'success' => true,
                'code' => $generatedCode,
                'created_at' => date('Y-m-d H:i:s'),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+5 years'))
            ];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error generating code: ' . $e->getMessage()];
        }
    }


    //Erstellt den neuen Gutschein in der DB

    public function createVoucher($data) {
        $code = $data['code'] ?? '';
        $initialValue = $data['initial_value'] ?? 0;
        $createdAt = $data['created_at'] ?? '';
        $expiresAt = $data['expires_at'] ?? '';

        if (strlen($code) !== 5 || $initialValue <= 0 || empty($createdAt) || empty($expiresAt)) {
            return ['success' => false, 'message' => 'Incomplete voucher data.'];
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO vouchers (code, initial_value, created_at, expires_at, is_redeemed)
                VALUES (:code, :initial_value, :created_at, :expires_at, 0)
            ");

            $stmt->execute([
                ':code' => strtoupper($code),
                ':initial_value' => $initialValue,
                ':created_at' => $createdAt,
                ':expires_at' => $expiresAt
            ]);

            return ['success' => true, 'message' => 'Voucher successfully created!'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error saving voucher: ' . $e->getMessage()];
        }
    }

    //Holt alle existierenden Gutscheine für den Admin ab

    public function getAllVouchers() {
        try {
            $stmt = $this->db->query("
                SELECT code, initial_value, created_at, expires_at, is_redeemed
                FROM vouchers
                ORDER BY id DESC
            ");
            $vouchers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ['success' => true, 'data' => $vouchers];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error fetching vouchers: ' . $e->getMessage()];
        }
    }


     //Prüft einen Gutscheincode für den Kunden und gibt den Wert zurück

    public function verifyAndGetVoucher($code) {
        if (strlen($code) !== 5) {
            return ['success' => false, 'message' => 'Invalid code format.'];
        }

        try {
            // Gutschein aus der DB holen
            $stmt = $this->db->prepare("
                SELECT initial_value, is_redeemed, expires_at
                FROM vouchers
                WHERE code = :code
            ");
            $stmt->execute([':code' => strtoupper($code)]);
            $voucher = $stmt->fetch(PDO::FETCH_ASSOC);

            // 1. Existenzprüfung
            if (!$voucher) {
                return ['success' => false, 'message' => 'Voucher code does not exist.'];
            }

            // 2. Prüfen, ob bereits eingelöst
            if ($voucher['is_redeemed'] == 1) {
                return ['success' => false, 'message' => 'This voucher has already been used.'];
            }

            // 3. Prüfen, ob das Ablaufdatum überschritten ist
            $currentDate = date('Y-m-d H:i:s');
            if ($voucher['expires_at'] < $currentDate) {
                return ['success' => false, 'message' => 'This voucher has expired.'];
            }

            // Wenn alle Prüfungen bestanden sind: Wert zurückgeben
            return [
                'success' => true,
                'message' => 'Voucher applied successfully!',
                'value' => (float)$voucher['initial_value']
            ];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }


    //Markiert einen Gutschein nach erfolgreicher Bestellung als eingelöst

    public function markAsRedeemed($code) {
        try {
            $stmt = $this->db->prepare("
                UPDATE vouchers
                SET is_redeemed = 1
                WHERE code = :code
            ");
            $stmt->execute([':code' => strtoupper($code)]);
            return true;
        } catch (PDOException $e) {
            error_log("Error disabling voucher: " . $e->getMessage());
            return false;
        }
    }
}