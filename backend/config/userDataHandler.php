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

    public function getCheckoutPaymentMethod($userId, $paymentMethodId) {
        if ($paymentMethodId === null || $paymentMethodId === '' || $paymentMethodId === 'default') {
            $user = $this->getUserById($userId);
            if (!$user) {
                return null;
            }

            return [
                'id' => 'default',
                'method' => $user['payment_method'],
                'details' => $user['payment_details'],
            ];
        }

        $stmt = $this->db->prepare(
            "SELECT id, method, details
             FROM payment_methods
             WHERE id = :id AND user_id = :uid"
        );
        $stmt->execute([
            ':id' => (int)$paymentMethodId,
            ':uid' => $userId,
        ]);

        $paymentMethod = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$paymentMethod) {
            return null;
        }

        return $paymentMethod;
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
                $additionalUpdateResult = $this->updateAdditionalPaymentMethods($userData);
                if (!$additionalUpdateResult['success']) {
                    return $additionalUpdateResult;
                }

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

    private function updateAdditionalPaymentMethods($userData) {
        if (!isset($userData['additionalPaymentMethods']) || !is_array($userData['additionalPaymentMethods'])) {
            return ["success" => true];
        }

        $seenMethods = [];
        foreach ($userData['additionalPaymentMethods'] as $paymentMethodData) {
            $paymentId = (int)($paymentMethodData['id'] ?? 0);
            $method = trim($paymentMethodData['paymentMethod'] ?? '');
            $details = trim($paymentMethodData['details'] ?? '');

            if ($paymentId <= 0 || !in_array($method, ['invoice', 'creditcard'], true)) {
                return ["success" => false, "message" => "Invalid additional payment method."];
            }

            $currentStmt = $this->db->prepare(
                "SELECT method, details FROM payment_methods WHERE id = :id AND user_id = :uid"
            );
            $currentStmt->execute([
                ':id' => $paymentId,
                ':uid' => $_SESSION['user_id'],
            ]);
            $currentPaymentMethod = $currentStmt->fetch(PDO::FETCH_ASSOC);

            if (!$currentPaymentMethod) {
                return ["success" => false, "message" => "Additional payment method not found."];
            }

            $finalDetails = null;
            if ($method === 'creditcard') {
                if ($details === '' || $details === '****') {
                    $finalDetails = $currentPaymentMethod['method'] === 'creditcard'
                        ? $currentPaymentMethod['details']
                        : null;
                } else {
                    $finalDetails = $details;
                }

                if (empty($finalDetails)) {
                    return ["success" => false, "message" => "Please enter your credit card number."];
                }
            }

            $duplicateKey = $this->getPaymentMethodDuplicateKey($method, $finalDetails);
            if (isset($seenMethods[$duplicateKey])) {
                return ["success" => false, "message" => "This payment method already exists on your account."];
            }
            $seenMethods[$duplicateKey] = true;

            if ($this->paymentMethodExists($_SESSION['user_id'], $method, $finalDetails, $paymentId)) {
                return ["success" => false, "message" => "This payment method already exists on your account."];
            }
            if ($this->defaultPaymentMethodExists($_SESSION['user_id'], $method, $finalDetails)) {
                return ["success" => false, "message" => "This payment method already exists on your account."];
            }

            $updateStmt = $this->db->prepare(
                "UPDATE payment_methods 
                 SET method = :method, details = :details
                 WHERE id = :id AND user_id = :uid"
            );
            $updateStmt->execute([
                ':method' => $method,
                ':details' => $finalDetails,
                ':id' => $paymentId,
                ':uid' => $_SESSION['user_id'],
            ]);
        }

        return ["success" => true];
    }

    private function normalizePaymentDetails($method, $details) {
        if ($method !== 'creditcard') {
            return null;
        }

        return preg_replace('/\s+/', '', trim($details ?? ''));
    }

    private function getPaymentMethodDuplicateKey($method, $details) {
        return $method . ':' . ($this->normalizePaymentDetails($method, $details) ?? '');
    }

    private function paymentMethodExists($userId, $method, $details, $excludePaymentId = null) {
        $normalizedDetails = $this->normalizePaymentDetails($method, $details);
        $sql = "SELECT id, details FROM payment_methods
                WHERE user_id = :uid
                  AND method = :method";

        $params = [
            ':uid' => $userId,
            ':method' => $method,
        ];

        if ($excludePaymentId !== null) {
            $sql .= " AND id != :exclude_id";
            $params[':exclude_id'] = $excludePaymentId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $paymentMethod) {
            if ($this->normalizePaymentDetails($method, $paymentMethod['details']) === $normalizedDetails) {
                return true;
            }
        }

        return false;
    }

    private function defaultPaymentMethodExists($userId, $method, $details) {
        $normalizedDetails = $this->normalizePaymentDetails($method, $details);
        $stmt = $this->db->prepare(
            "SELECT payment_method, payment_details FROM users WHERE user_id = :uid"
        );
        $stmt->execute([':uid' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || $user['payment_method'] !== $method) {
            return false;
        }

        return $this->normalizePaymentDetails($method, $user['payment_details']) === $normalizedDetails;
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

        //Get all methods of current user
        public function getPaymentMethods() {
            if (session_status() == PHP_SESSION_NONE) { session_start(); }
            if (!isset($_SESSION['user_id'])) {
                return ["success" => false, "message" => "Unauthorized."];
            }
            try {
                $stmt = $this->db->prepare(
                    "SELECT id, method, details, is_default 
                 FROM payment_methods 
                 WHERE user_id = :uid 
                 ORDER BY is_default DESC"
                );
                $stmt->execute([':uid' => $_SESSION['user_id']]);
                $paymentMethods = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($paymentMethods as &$paymentMethod) {
                    if ($paymentMethod['method'] === 'creditcard') {
                        $paymentMethod['details'] = '****';
                    }
                }
                unset($paymentMethod);

                return ["success" => true, "data" => $paymentMethods];
            } catch (PDOException $e) {
                return ["success" => false, "message" => "DB Error: " . $e->getMessage()];
            }
        }

        //Add Payment Methods to Database
        public function addPaymentMethod($data) {
            if (session_status() == PHP_SESSION_NONE) { session_start(); }
            if (!isset($_SESSION['user_id'])) {
                return ["success" => false, "message" => "Unauthorized."];
            }

            $method  = trim($data['paymentMethod']  ?? '');
            $details = trim($data['details'] ?? '');

            if (empty($method)) {
                return ["success" => false, "message" => "Please select a payment method."];
            }
            if ($method === 'creditcard' && empty($details)) {
                return ["success" => false, "message" => "Please enter your credit card number."];
            }

            try {
                $normalizedDetails = $this->normalizePaymentDetails($method, $details);
                if (
                    $this->paymentMethodExists($_SESSION['user_id'], $method, $normalizedDetails) ||
                    $this->defaultPaymentMethodExists($_SESSION['user_id'], $method, $normalizedDetails)
                ) {
                    return ["success" => false, "message" => "This payment method already exists on your account."];
                }

                $stmt = $this->db->prepare(
                    "INSERT INTO payment_methods (user_id, method, details, is_default) 
                 VALUES (:uid, :method, :details, 0)"
                );
                $stmt->execute([
                    ':uid'     => $_SESSION['user_id'],
                    ':method'  => $method,
                    ':details' => $normalizedDetails,
                ]);
                return ["success" => true, "message" => "Payment method added successfully!"];
            } catch (PDOException $e) {
                return ["success" => false, "message" => "DB Error: " . $e->getMessage()];
            }
        }

        public function deletePaymentMethod($data) {
            if (session_status() == PHP_SESSION_NONE) { session_start(); }
            if (!isset($_SESSION['user_id'])) {
                return ["success" => false, "message" => "Unauthorized."];
            }

            $paymentId = (int)($data['paymentId'] ?? 0);
            if ($paymentId <= 0) {
                return ["success" => false, "message" => "Missing payment method."];
            }

            try {
                $stmt = $this->db->prepare(
                    "DELETE FROM payment_methods 
                     WHERE id = :id AND user_id = :uid AND is_default = 0"
                );
                $stmt->execute([
                    ':id' => $paymentId,
                    ':uid' => $_SESSION['user_id'],
                ]);

                if ($stmt->rowCount() === 0) {
                    return ["success" => false, "message" => "Payment method could not be deleted."];
                }

                return ["success" => true, "message" => "Payment method deleted successfully."];
            } catch (PDOException $e) {
                return ["success" => false, "message" => "DB Error: " . $e->getMessage()];
            }
        }

    //Schreibt ein Restguthaben auf das Konto des Users gut
    public function addToUserBalance($userId, $amount) {
         try {
             // COALESCE sorgt dafür, dass falls die Balance NULL ist, mit 0 gerechnet wird
             $stmt = $this->db->prepare("
                 UPDATE users
                 SET balance = COALESCE(balance, 0) + :amount
                 WHERE user_id = :user_id
             ");
             return $stmt->execute([
                 ':amount'  => $amount,
                 ':user_id' => $userId
             ]);
         } catch (PDOException $e) {
             error_log("Error updating user balance: " . $e->getMessage());
             return false;
         }
    }
}
