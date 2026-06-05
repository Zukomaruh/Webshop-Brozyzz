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

    //User Session Start mit Warenkorb-Synchronisation in eigene Funktion ausgelagert für remember_login
    private function startUserSession($user) {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['firstname'] = $user['firstname'];

        // Warenkorb-Synchronisation
        $dbCart = $this->loadCartFromDb($user['user_id']);

        if (!isset($_SESSION['cart'])) {
            $_SESSION['cart'] = [];
        }

        foreach ($dbCart as $pid => $qty) {
            if (isset($_SESSION['cart'][$pid])) {
                $_SESSION['cart'][$pid] += $qty;
            } else {
                $_SESSION['cart'][$pid] = $qty;
            }
        }

        $this->saveCartToDb($user['user_id'], $_SESSION['cart']);
    }

    public function loginUser($data) {
        // SQL-Query erweitert, um auch den Status zu holen
        $sql = "SELECT * FROM users WHERE email = :identifier OR username = :identifier";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':identifier' => $data['identifier']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($data['password'], $user['password'])) {

            //Wenn der User deaktiviert ist, Login sofort abbrechen!
            if (isset($user['status']) && $user['status'] === 'inactive') {
                return ["success" => false, "message" => "Your account has been deactivated. Please contact support."];
            }

            $this->startUserSession($user);

            if (isset($data['rememberMe']) && $data['rememberMe'] == "1") {
                $this->createRememberToken($user['user_id']);
            }

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

        $this->checkRememberLogin();

        if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') { return ["isAdmin" => true]; }
        return ["isAdmin" => false];
    }

    public function logoutUser() {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }
        if (isset($_SESSION['user_id']) && isset($_SESSION['cart'])) { $this->saveCartToDb($_SESSION['user_id'], $_SESSION['cart']); }
        $this->clearRememberToken();
        $_SESSION = []; session_destroy();
        return ["success" => true, "message" => "Logout successful!"];
    }

    public function checkSession() {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }

        $this->checkRememberLogin();

        if (isset($_SESSION['user_id'])) {

            // NEU: Live-Check in der DB, ob der User noch aktiv ist
            try {
                $stmt = $this->db->prepare("SELECT status FROM users WHERE user_id = :uid");
                $stmt->execute([':uid' => $_SESSION['user_id']]);
                $userStatus = $stmt->fetchColumn();

                // Wenn er in der DB inaktiv ist -> Session zerstören!
                if ($userStatus === 'inactive') {
                    $this->logoutUser(); // Ruft deine bestehende Logout-Logik auf (löscht auch Cookies)
                    return ["loggedIn" => false, "message" => "Account deactivated."];
                }
            } catch (PDOException $e) {
                // Bei DB-Fehler im Zweifel eingeloggt lassen oder restriktiv blockieren
            }

            return ["loggedIn" => true, "role" => $_SESSION['role'], "firstname" => $_SESSION['firstname']];
        }
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

    public function clearCart($userId) {
        $stmt = $this->db->prepare("DELETE FROM shopping_cart WHERE user_id = :uid");
        $stmt->execute([':uid' => $userId]);
    }

    public function getUserProfile() {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }

        $this->checkRememberLogin();

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

    public function getUserById($userId){
        $stmt = $this->db->prepare("
        SELECT firstname, lastname, email, address, zip, city, payment_method, payment_details
        FROM users WHERE user_id = :uid
    ");
        $stmt->execute([':uid' => $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    //Diese Methode holt speziell für den Admin alle nötigen Modal-Daten eines Users (ohne Passwort)
    public function getUserDetailsForAdmin($data) {
        if (session_status() == PHP_SESSION_NONE) { session_start(); }

        // Server-Sicherheitscheck
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            return ["success" => false, "message" => "Unauthorized access. Admins only."];
        }

        if (!isset($data['userId'])) {
            return ["success" => false, "message" => "Missing user ID."];
        }

        try {
            $sql = "SELECT username, firstname, lastname, gender, email, address, zip, city, payment_method
                    FROM users WHERE user_id = :uid";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':uid' => $data['userId']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                return ["success" => true, "data" => $user];
            }
            return ["success" => false, "message" => "User not found."];
        } catch (PDOException $e) {
            return ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }
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
                return ["success" => false, "message" => "Confirmation failed. Current password incorrect."];
            }

            // 2. Logik für Kreditkartendaten
            $finalPaymentDetails = $userData['paymentDetails'] ?? null;
            if ($userData['paymentMethod'] === "creditcard" && empty(trim($userData['paymentDetails']))) {
                if ($currentUser['payment_method'] === "creditcard") {
                    $finalPaymentDetails = $currentUser['payment_details'];
                }
            }

            // 3. Dynamischer Passwort-Wechsel (Falls ausgefüllt)
            $passwordUpdateString = "";
            $updatedPasswordHash = null;

            if (isset($userData['newPassword']) && !empty(trim($userData['newPassword']))) {
                $passwordUpdateString = ", password = :new_pass";
                $updatedPasswordHash = password_hash($userData['newPassword'], PASSWORD_DEFAULT);
            }

            // 4. Update ausführen (Query nutzt den dynamischen Passwort-String)
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
                        $passwordUpdateString
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

            // Nur binden, wenn das Passwort tatsächlich geändert werden soll
            if ($updatedPasswordHash !== null) {
                $stmt->bindValue(":new_pass", $updatedPasswordHash);
            }

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

    private function createRememberToken($userId) {
        // Alten Token für diesen User löschen, damit pro User nur ein aktiver Remember-Login existiert
        $deleteSql = "DELETE FROM remember_tokens WHERE user_id = :uid";
        $deleteStmt = $this->db->prepare($deleteSql);
        $deleteStmt->execute([':uid' => $userId]);

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash("sha256", $token);

        $expiresTimestamp = time() + (30 * 24 * 60 * 60);
        $expiresAt = date("Y-m-d H:i:s", $expiresTimestamp);

        $sql = "INSERT INTO remember_tokens (user_id, token_hash, expires_at)
                VALUES (:uid, :token_hash, :expires_at)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':uid' => $userId,
            ':token_hash' => $tokenHash,
            ':expires_at' => $expiresAt
        ]);

        setcookie("remember_login", $token, [
            "expires" => $expiresTimestamp,
            "path" => "/",
            "httponly" => true,
            "samesite" => "Lax",
            "secure" => !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off"
        ]);
    }

    public function checkRememberLogin() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }

        // Wenn er schon eine Session hat, prüfen wir seinen Status weiter unten in checkSession,
        // daher lassen wir das hier so, falls er KEINE Session hat, aber ein Cookie:
        if (isset($_SESSION['user_id'])) {
            return true;
        }

        if (!isset($_COOKIE['remember_login'])) {
            return false;
        }

        $token = $_COOKIE['remember_login'];
        $tokenHash = hash("sha256", $token);

        try {
            // SQL-Query fragt nun den Status ab
            $sql = "SELECT users.*
                    FROM remember_tokens
                    JOIN users ON remember_tokens.user_id = users.user_id
                    WHERE remember_tokens.token_hash = :token_hash
                    AND remember_tokens.expires_at > NOW()
                    LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([':token_hash' => $tokenHash]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                // NEU: Wenn der User über das Cookie kommt, aber inaktiv ist, Token löschen!
                if ($user['status'] === 'inactive') {
                    $this->clearRememberToken();
                    return false;
                }

                $this->startUserSession($user);
                return true;
            }

            $this->clearRememberToken();
            return false;

        } catch (PDOException $e) {
            return false;
        }
    }

    private function clearRememberToken() {
        if (isset($_COOKIE['remember_login'])) {
            $tokenHash = hash("sha256", $_COOKIE['remember_login']);

            $sql = "DELETE FROM remember_tokens WHERE token_hash = :token_hash";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':token_hash' => $tokenHash]);
        }

        setcookie("remember_login", "", [
            "expires" => time() - 3600,
            "path" => "/",
            "httponly" => true,
            "samesite" => "Lax",
            "secure" => !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off"
        ]);
    }

    public function getAllCustomers() {
            if (session_status() == PHP_SESSION_NONE) { session_start(); }

            if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
                return ["success" => false, "message" => "Unauthorized access. Admins only."];
            }

            try {
                // "status" und "role" zur Query hinzugefügt
                $sql = "SELECT user_id, firstname, lastname, gender, username, email, role, status FROM users ORDER BY user_id ASC";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

                return ["success" => true, "data" => $customers];
            } catch (PDOException $e) {
                return ["success" => false, "message" => "Database error: " . $e->getMessage()];
            }
        }

        //Für Customer-Deactivation
        public function toggleCustomerStatus($data) {
            if (session_status() == PHP_SESSION_NONE) { session_start(); }

            // Server-Schutz
            if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
                return ["success" => false, "message" => "Unauthorized access. Admins only."];
            }

            if (!isset($data['userId']) || !isset($data['status'])) {
                return ["success" => false, "message" => "Missing parameters."];
            }

            try {
                // Eigener Schutz: Ein Admin darf sich nicht selbst deaktivieren
                if ($data['userId'] == $_SESSION['user_id']) {
                    return ["success" => false, "message" => "You cannot deactivate your own admin account."];
                }

                $sql = "UPDATE users SET status = :status WHERE user_id = :uid";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([
                    ':status' => $data['status'],
                    ':uid' => $data['userId']
                ]);

                return ["success" => true, "message" => "Customer status updated successfully."];

            } catch (PDOException $e) {
                return ["success" => false, "message" => "Database error: " . $e->getMessage()];
            }
        }
}