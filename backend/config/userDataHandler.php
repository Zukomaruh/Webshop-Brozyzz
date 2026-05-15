<?php
require_once "dbaccess.php";

class UserDataHandler {
    private $db;

    public function __construct() {
        $dbAccess = new DBAccess();
        $this->db = $dbAccess->getConnection();
    }

    public function registerUser($userData) {
        // Serverseitige Validierung auf Vollständigkeit (Laut Spezifikation Pflicht!)
        $requiredFields = ['gender', 'firstName', 'lastName', 'username', 'email', 'address', 'zip', 'city', 'paymentMethod', 'password'];
        foreach ($requiredFields as $field) {
            if (!isset($userData[$field]) || empty(trim($userData[$field]))) {
                return ["success" => false, "message" => "Bitte alle Pflichtfelder ausfüllen."];
            }
        }

        try {
            $sql = "INSERT INTO users (firstname, lastname, gender, username, email, address, zip, city, payment_method, payment_details, password, role)
                    VALUES (:fname, :lname, :gender, :uname, :email, :address, :zip, :city, :pay_method, :pay_details, :pass, :role)";

            $stmt = $this->db->prepare($sql);
            $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);

            $stmt->bindValue(":fname", $userData['firstName']);
            $stmt->bindValue(":lname", $userData['lastName']);
            $stmt->bindValue(":gender", $userData['gender']);
            $stmt->bindValue(":uname", $userData['username']);
            $stmt->bindValue(":email", $userData['email']);
            $stmt->bindValue(":address", $userData['address']);
            $stmt->bindValue(":zip", $userData['zip']);
            $stmt->bindValue(":city", $userData['city']);
            $stmt->bindValue(":pay_method", $userData['paymentMethod']);
            $stmt->bindValue(":pay_details", $userData['paymentDetails'] ?? null);
            $stmt->bindValue(":pass", $hashedPassword);
            $stmt->bindValue(":role", 'user');

            if ($stmt->execute()) {
                return ["success" => true, "message" => "Registrierung erfolgreich!"];
            }
        } catch (PDOException $e) {
            // Fängt Duplikate bei Email oder Username ab
            if ($e->getCode() == 23000) {
                return ["success" => false, "message" => "Benutzername oder E-Mail-Adresse bereits vergeben."];
            }
            return ["success" => false, "message" => "DB-Fehler: " . $e->getMessage()];
        }
        return ["success" => false, "message" => "Fehler beim Speichern."];
    }

    public function loginUser($data) {
        // SQL-Query sucht nun nach Email ODER Username
        $sql = "SELECT * FROM users WHERE email = :identifier OR username = :identifier";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':identifier' => $data['identifier']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($data['password'], $user['password'])) {
            if (session_status() == PHP_SESSION_NONE) { session_start(); }

            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['firstname'] = $user['firstname'];

            // Warenkorb-Synchronisation
            $dbCart = $this->loadCartFromDb($user['user_id']);
            if (!isset($_SESSION['cart'])) { $_SESSION['cart'] = []; }

            foreach ($dbCart as $pid => $qty) {
                if (isset($_SESSION['cart'][$pid])) {
                    $_SESSION['cart'][$pid] += $qty;
                } else {
                    $_SESSION['cart'][$pid] = $qty;
                }
            }

            $this->saveCartToDb($user['user_id'], $_SESSION['cart']);

            return [
                "success" => true,
                "message" => "Willkommen zurück, " . $user['firstname'] . "!",
                "user" => ["id" => $user['user_id'], "role" => $user['role']]
            ];
        }
        return ["success" => false, "message" => "E-Mail/Username oder Passwort falsch."];
    }

    // (Die Funktionen checkAdminSession, logoutUser, checkSession, saveCartToDb und loadCartFromDb bleiben unverändert wie in deinem Ausgangs-File)
    public function checkAdminSession() {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }
        if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') { return ["isAdmin" => true]; }
        return ["isAdmin" => false];
    }

    public function logoutUser() {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }
        if (isset($_SESSION['user_id']) && isset($_SESSION['cart'])) { $this->saveCartToDb($_SESSION['user_id'], $_SESSION['cart']); }
        $_SESSION = []; session_destroy();
        return ["success" => true, "message" => "Logout erfolgreich!"];
    }

    public function checkSession() {
        if(session_status() == PHP_SESSION_NONE){ session_start(); }
        if(isset($_SESSION['user_id'])){ return ["loggedIn" => true, "role" => $_SESSION['role'],"firstname" => $_SESSION['firstname']]; }
        return ["loggedIn" => false];
    }

    private function saveCartToDb($userId, $cartData) {
        $deleteSql = "DELETE FROM shopping_cart WHERE user_id = :uid";
        $deleteStmt = $this->db->prepare($deleteSql);
        $deleteStmt->execute([':uid' => $userId]);
        if (empty($cartData)) { return; }
        $insertSql = "INSERT INTO shopping_cart (user_id, product_id, quantity) VALUES (:uid, :pid, :qty)";
        $insertStmt = $this->db->prepare($insertSql);
        foreach ($cartData as $productId => $quantity) {
            $insertStmt->execute([':uid' => $userId, ':pid' => $productId, ':qty' => $quantity]);
        }
    }

    private function loadCartFromDb($userId) {
        $sql = "SELECT product_id, quantity FROM shopping_cart WHERE user_id = :uid";
        $stmt = $this->db->prepare($sql); $stmt->execute([':uid' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    }
}