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
            default:
                return ["error" => "Unknown method"];
        }
    }

    private function placeOrder($data)
    {
        //Validierung:
        // Check 1: Log-in Status
        if (!isset($_SESSION['user_id'])) {
            return ["error" => "not_logged_in", "debug" => $_SESSION];
        }

        // Check 2: Ob Warenkorb Items beinhaltet (keine Order ohne Produkte)
        if (!isset($_SESSION['cart']) || empty($_SESSION['cart'])) {
            return ["error" => "cart_empty"];
        }

        $userId = $_SESSION['user_id'];

        // Check 3: ob User-Daten & Zahlungsmethode Vollständig hinterlegt wurden
        $user = $this->userDataHandler->getUserById($userId);
        //fragt fehlende INformation ab
        $missingFields = [];
        if (empty($user['firstname'])) $missingFields[] = "First name";
        if (empty($user['lastname'])) $missingFields[] = "Last name";
        if (empty($user['email'])) $missingFields[] = "Email";
        if (empty($user['address'])) $missingFields[] = "Address";
        if (empty($user['zip'])) $missingFields[] = "ZIP code";
        if (empty($user['city'])) $missingFields[] = "City";
        if (empty($user['payment_method'])) $missingFields[] = "Payment method";
        if ($user['payment_method'] === 'creditcard' && empty($user['payment_details'])) {
            $missingFields[] = "Credit card details";
        }
        if (!empty($missingFields)) {
            return [
                "error" => "missing_user_data",
                "missing" => $missingFields
            ];
        }

        //Produkte laden und Beträge berrechnen
        $items = [];
        $subtotal = 0;

        foreach ($_SESSION['cart'] as $productId => $quantity) {
            $product = $this->productDataHandler->getProductById($productId);
            if (!$product) continue;

            $itemTotal = $product['price'] * $quantity;
            $subtotal += $itemTotal;

            $items[] = [
                'product_id'   => $productId,
                'product_name' => $product['name'],
                'quantity'     => $quantity,
                'unit_price'   => $product['price'],
                'total'        => $itemTotal
            ];
        }

        $subtotal = number_format($subtotal, 2);
        $taxAmount = number_format($subtotal * 20 / 120, 2);

        $couponCode = null;
        $discountAmount = 0.0;
        $total = $subtotal;
        if (!empty($data['coupon_code'])) {
            //Hier GutscheinLogic einfügen, wenn Zeit ist
        }

        $shippingAddress = json_encode([
            'address' => $user['address'],
            'zip'     => $user['zip'],
            'city'    => $user['city']
        ]);

        try {
            $orderId = $this->orderDataHandler->createOrder(
                $userId, $subtotal, $taxAmount, $total,
                $couponCode, $discountAmount, $shippingAddress
            );

            $this->orderDataHandler->createOrderItems($orderId, $items);

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
}
