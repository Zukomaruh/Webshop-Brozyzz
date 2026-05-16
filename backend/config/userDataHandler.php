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
                return ["success" => false, "message" => "Please fill in all the required fields."];
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
                return ["success" => true, "message" => "Registration successful!"];
            }
        } catch (PDOException $e) {
            // Fängt Duplikate bei Email oder Username ab
            if ($e->getCode() == 23000) {
                return ["success" => false, "message" => "Username or email address already in use."];
            }
            return ["success" => false, "message" => "DB-Error: " . $e->getMessage()];
        }
        return ["success" => false, "message" => "Error saving."];
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
                "message" => "Welcome back, " . $user['username'] . "!",
                "user" => ["id" => $user['user_id'], "role" => $user['role']]
            ];
        }
        return ["success" => false, "message" => "Incorrect email address/username or password."];
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
        return ["success" => true, "message" => "Logout sucessful!"];
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

    public function getUserProfile() {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }

        // Sicherheitscheck: Ist überhaupt jemand eingeloggt?
        if (!isset($_SESSION['user_id'])) {
            return ["success" => false, "message" => "Unauthorized access. Please log in."];
        }

        try {
            // Passwort wird absichtlich exkludiert!
            $sql = "SELECT firstname, lastname, gender, username, email, address, zip, city, payment_method, payment_details
                    FROM users
                    WHERE user_id = :uid";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([':uid' => $_SESSION['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                return ["success" => true, "data" => $user];
            }
        } catch (PDOException $e) {
            return ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }

        return ["success" => false, "message" => "User profile not found."];
    }

    public function updateUserProfile($userData) {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }

        if (!isset($_SESSION['user_id'])) {
            return ["success" => false, "message" => "Unauthorized access."];
        }

        $requiredFields = ['gender', 'firstName', 'lastName', 'username', 'email', 'address', 'zip', 'city', 'paymentMethod', 'passwordConfirm'];
        foreach ($requiredFields as $field) {
            if (!isset($userData[$field]) || empty(trim($userData[$field]))) {
                return ["success" => false, "message" => "Please fill in all required fields."];
            }
        }

        try {
            // 1. Passwort und aktuelle Zahlungsdetails abfragen
            $userSql = "SELECT password, payment_method, payment_details FROM users WHERE user_id = :uid";
            $userStmt = $this->db->prepare($userSql);
            $userStmt->execute([':uid' => $_SESSION['user_id']]);
            $currentUser = $userStmt->fetch(PDO::FETCH_ASSOC);

            if (!$currentUser || !password_verify($userData['passwordConfirm'], $currentUser['password'])) {
                return ["success" => false, "message" => "Confirmation failed. Password incorrect."];
            }

            // 2. Logik für sensible Kreditkartendaten:
            // Wenn Methode Kreditkarte bleibt und das Feld leer übermittelt wurde, behalten wir die alte Nummer bei.
            $finalPaymentDetails = $userData['paymentDetails'] ?? null;

            if ($userData['paymentMethod'] === "creditcard" && empty(trim($userData['paymentDetails']))) {
                if ($currentUser['payment_method'] === "creditcard") {
                    $finalPaymentDetails = $currentUser['payment_details']; // Alte Karte retten
                }
            }

            // 3. Update ausführen
            $sql = "UPDATE users SET
                        firstname = :fname,
                        lastname = :lname,
                        gender = :gender,
                        username = :uname,
                        email = :email,
                        address = :address,
                        zip = :zip,
                        city = :city,
                        payment_method = :pay_method,
                        payment_details = :pay_details
                    WHERE user_id = :uid";

            $stmt = $this->db->prepare($sql);

            $stmt->bindValue(":fname", $userData['firstName']);
            $stmt->bindValue(":lname", $userData['lastName']);
            $stmt->bindValue(":gender", $userData['gender']);
            $stmt->bindValue(":uname", $userData['username']);
            $stmt->bindValue(":email", $userData['email']);
            $stmt->bindValue(":address", $userData['address']);
            $stmt->bindValue(":zip", $userData['zip']);
            $stmt->bindValue(":city", $userData['city']);
            $stmt->bindValue(":pay_method", $userData['paymentMethod']);
            $stmt->bindValue(":pay_details", $finalPaymentDetails);
            $stmt->bindValue(":uid", $_SESSION['user_id']);

            if ($stmt->execute()) {
                $_SESSION['firstname'] = $userData['firstName'];
                return ["success" => true, "message" => "Profile updated successfully!"];
            }
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                return ["success" => false, "message" => "Username or Email address already in use."];
            }
            return ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }

        return ["success" => false, "message" => "Failed to update profile."];
    }
}