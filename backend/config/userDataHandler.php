<?php
require_once "dbaccess.php";

class UserDataHandler {
    private $db;

    public function __construct() {
        $dbAccess = new DBAccess();
        $this->db = $dbAccess->getConnection();
    }

    public function registerUser($userData) {
        try {
            $sql = "INSERT INTO users (firstname, lastname, email, password, role)
                    VALUES (:fname, :lname, :email, :pass, :role)";

            $stmt = $this->db->prepare($sql);
            $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);

            $stmt->bindValue(":fname", $userData['firstName']);
            $stmt->bindValue(":lname", $userData['lastName']);
            $stmt->bindValue(":email", $userData['email']);
            $stmt->bindValue(":pass", $hashedPassword);
            $stmt->bindValue(":role", 'user');

            if ($stmt->execute()) {
                return ["success" => true, "message" => "Registrierung erfolgreich!"];
            }
        } catch (PDOException $e) {
            return ["success" => false, "message" => "DB-Fehler: " . $e->getMessage()];
        }
        return ["success" => false, "message" => "Fehler beim Speichern."];
    }

    public function loginUser($data) {
        $sql = "SELECT * FROM users WHERE email = :email";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($data['password'], $user['password'])) {
            if (session_status() == PHP_SESSION_NONE) { session_start(); }

            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['firstname'] = $user['firstname'];

            // --- NEU: Warenkorb-Synchronisation ---
            $dbCart = $this->loadCartFromDb($user['user_id']);

            if (!isset($_SESSION['cart'])) {
                $_SESSION['cart'] = [];
            }

            // Merge: DB-Warenkorb in die aktuelle Session laden
            foreach ($dbCart as $pid => $qty) {
                if (isset($_SESSION['cart'][$pid])) {
                    // Wenn Produkt schon im Gast-Warenkorb, Mengen addieren
                    $_SESSION['cart'][$pid] += $qty;
                } else {
                    $_SESSION['cart'][$pid] = $qty;
                }
            }

            // Den nun kombinierten Warenkorb sofort wieder in der DB sichern
            $this->saveCartToDb($user['user_id'], $_SESSION['cart']);
            // --------------------------------------

            return [
                "success" => true,
                "message" => "Willkommen zurück, " . $user['firstname'] . "!",
                "user" => ["id" => $user['user_id'], "role" => $user['role']]
            ];
        }
        return ["success" => false, "message" => "E-Mail oder Passwort falsch."];
    }

    public function checkAdminSession() {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }

        // Prüfen ob eingeloggt UND ob die Rolle admin ist
        if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
            return ["isAdmin" => true];
        }

        return ["isAdmin" => false];
    }

    public function logoutUser() {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }

        // Falls ein User eingeloggt ist, Warenkorb in DB retten
        if (isset($_SESSION['user_id']) && isset($_SESSION['cart'])) {
            $this->saveCartToDb($_SESSION['user_id'], $_SESSION['cart']);
        }

        $_SESSION = [];
        session_destroy();
        return ["success" => true, "message" => "Logout erfolgreich!"];
    }

    //checkt session status und User-role für Zugriffskontrolle
    public function checkSession()
    {
        if(session_status() == PHP_SESSION_NONE){ session_status(); }
        if(isset($_SESSION['user_id'])){
            return ["loggedIn" => true, "role" => $_SESSION['role'],"firstname" => $_SESSION['firstname']];
        }
        return ["loggedIn" => false];
    }

    //user x cart functions

    private function saveCartToDb($userId, $cartData) {
        // 1. Zuerst alles löschen, was dieser User aktuell in der DB hat
        $deleteSql = "DELETE FROM shopping_cart WHERE user_id = :uid";
        $deleteStmt = $this->db->prepare($deleteSql);
        $deleteStmt->execute([':uid' => $userId]);

        // 2. Wenn die Session leer ist (alle Produkte gelöscht), sind wir hier fertig
        if (empty($cartData)) {
            return;
        }

        // 3. Jetzt den aktuellen Stand aus der Session speichern
        $insertSql = "INSERT INTO shopping_cart (user_id, product_id, quantity)
                      VALUES (:uid, :pid, :qty)";
        $insertStmt = $this->db->prepare($insertSql);

        foreach ($cartData as $productId => $quantity) {
            $insertStmt->execute([
                ':uid' => $userId,
                ':pid' => $productId,
                ':qty' => $quantity
            ]);
        }
    }

    private function loadCartFromDb($userId) {
        $sql = "SELECT product_id, quantity FROM shopping_cart WHERE user_id = :uid";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':uid' => $userId]);

        // Gibt ein Array zurück: [productId => quantity, ...]
        return $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    }
}