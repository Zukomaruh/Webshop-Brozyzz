<?php
require_once "../config/orderDataHandler.php";
require_once "../config/productDataHandler.php";
require_once "../config/userDataHandler.php";


class OrderLogic
{
    private $orderDataHandler;
    private $productDataHandler;
    private $userDataHandler;

    public function __construct()
    {
       $this->orderDataHandler = new OrderDataHandler();
       $this->productDataHandler = new ProductDataHandler();
       $this->userDataHandler = new UserDataHandler();
    }

    public function handleRequest($method, $data)
    {
        switch ($method) {
            case "placeOrder":
                return $this->placeOrder($data);
            case "getOrders":
                return $this->getOrders();
            case "getOrderById":
                return $this->getOrderById($data);
            case "getOrdersByCustomerForAdmin":
                return $this->orderDataHandler->getOrdersByCustomerForAdmin($data);
            case "getOrderDetailsForAdmin":
                return $this->orderDataHandler->getOrderDetailsForAdmin($data);
           case "removeOrderItemFromOrder":
               return $this->orderDataHandler->removeOrderItemFromOrder($data);
            default:
                return ["error" => "Unknown method"];
        }
    }

    private function placeOrder($data)
    {
        // Check 1: Log-in Status
        if (!isset($_SESSION['user_id'])) {
            return ["error" => "not_logged_in", "debug" => $_SESSION];
        }

        // Check 2: Ob Warenkorb Items beinhaltet
        if (!isset($_SESSION['cart']) || empty($_SESSION['cart'])) {
            return ["error" => "cart_empty"];
        }

        $userId = $_SESSION['user_id'];

        // Check 3: Vollständigkeit der User-Daten & Zahlungsmethode
        $user = $this->userDataHandler->getUserById($userId);
        $selectedPaymentMethod = $this->userDataHandler->getCheckoutPaymentMethod(
            $userId,
            $data['paymentMethodId'] ?? 'default'
        );

        if (!$selectedPaymentMethod) {
            return ["error" => "invalid_payment_method"];
        }

        $missingFields = [];
        if (empty($user['firstname'])) $missingFields[] = "First name";
        if (empty($user['lastname'])) $missingFields[] = "Last name";
        if (empty($user['email'])) $missingFields[] = "Email";
        if (empty($user['address'])) $missingFields[] = "Address";
        if (empty($user['zip'])) $missingFields[] = "ZIP code";
        if (empty($user['city'])) $missingFields[] = "City";
        if (empty($selectedPaymentMethod['method'])) $missingFields[] = "Payment method";
        if ($selectedPaymentMethod['method'] === 'creditcard' && empty($selectedPaymentMethod['details'])) {
            $missingFields[] = "Credit card details";
        }
        if (!empty($missingFields)) {
            return [
                "error" => "missing_user_data",
                "missing" => $missingFields
            ];
        }

        // Produkte laden und reine numerische Beträge berechnen
        $items = [];
        $subtotalNum = 0.0; // Float-Basis für fehlerfreie Berechnung

        foreach ($_SESSION['cart'] as $productId => $quantity) {
            $product = $this->productDataHandler->getProductById($productId);
            if (!$product) continue;

            $itemTotal = $product['price'] * $quantity;
            $subtotalNum += $itemTotal;

            $items[] = [
                'product_id'   => $productId,
                'product_name' => $product['name'],
                'quantity'     => $quantity,
                'unit_price'   => $product['price'],
                'total'        => $itemTotal
            ];
        }

        // Vorab das bestehende User-Guthaben aus der DB holen, falls vorhanden
        $userBalanceNum = isset($user['balance']) ? (float)$user['balance'] : 0.0;

        //Verrechnung
        // 1. Die Steuer (20% MwSt.) wird vom Brutto-Warenwert berechnet
        $taxAmountNum = $subtotalNum * 20 / 120;

        // 2. Jetzt das Kunden-Guthaben auf die Summe anrechnen
        $balanceToUseNum = 0.0;
        if ($subtotalNum > 0.0 && $userBalanceNum > 0.0) {
            $balanceToUseNum = min($subtotalNum, $userBalanceNum);
        }

        // 3. Endsumme berechnen (was der User noch über die Bezahlmethode zahlen muss)
        $totalNum = max(0.0, $subtotalNum - $balanceToUseNum);

        // 4. Der Rabatt auf dieser Rechnung entspricht exakt dem verbrauchten Kontoguthaben
        $totalDiscountNum = $balanceToUseNum;

        // Werte für die Datenbank formatieren
        $subtotal = number_format($subtotalNum, 2, '.', '');
        $taxAmount = number_format($taxAmountNum, 2, '.', '');
        $total = number_format($totalNum, 2, '.', '');
        $discountAmount = number_format($totalDiscountNum, 2, '.', '');

        $shippingAddress = json_encode([
                    'address' => $user['address'],
                    'zip'     => $user['zip'],
                    'city'    => $user['city']
                ]);

                //Zahlungsdaten für die neuen Tabellenspalten vorbereiten
                $paymentMethod = $selectedPaymentMethod['method'];
                $paymentDetails = $selectedPaymentMethod['method'] === 'creditcard' ? '****' : null;

                try {
                    // Bestellung in DB anlegen
                    $orderId = $this->orderDataHandler->createOrder(
                        $userId, $subtotal, $taxAmount, $total,
                        $discountAmount, $shippingAddress, $paymentMethod, $paymentDetails
                    );

                    // Posten der Bestellung anlegen
                    $this->orderDataHandler->createOrderItems($orderId, $items);

                    // GUTHABEN-KONTO AKTUALISIEREN:
                    // Wenn Kontoguthaben zur Zahlung verwendet wurde -> Jetzt vom Userkonto in der DB abziehen
                    if ($balanceToUseNum > 0.0) {
                        $this->userDataHandler->deductUserBalance($userId, $balanceToUseNum);
                    }

                    // Warenkorb leeren
                    $_SESSION['cart'] = [];
                    $this->userDataHandler->clearCart($userId);

                    return [
                        "success"  => true,
                        "order_id" => $orderId,
                        "total"    => $total
                    ];

        } catch (Exception $e) {
            error_log("Order error: " . $e->getMessage());
            return ["error" => "db_error"];
        }
    }

    private function getOrders() {
        if (!isset($_SESSION['user_id'])) {
            return ["error" => "not_logged_in"];
        }
        $userId = $_SESSION['user_id'];
        $orders = $this->orderDataHandler->getOrdersByUserId($userId);
        return [
            "success" => true,
            "orders" => $orders
        ];
    }

    private function getOrderById($data){
        if (!isset($_SESSION['user_id'])) {
            return ["error" => "not_logged_in", "debug" => $_SESSION];
        }
        $orderId = $data['order_id'] ?? null;
        if (!$orderId) {
            return ["error" => "missing_order_id"];
        }
        $result = $this->orderDataHandler->getOrderById($orderId);
        if (!$result['order'] || (int)$result['order']['user_id'] !== (int)$_SESSION['user_id']) {
            return ["error" => "unauthorized"];
        }
        return ["success" => true, "data" => $result];
    }
}