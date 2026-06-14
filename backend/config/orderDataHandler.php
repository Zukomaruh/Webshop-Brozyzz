<?php
require_once "dbaccess.php";

class OrderDataHandler {
    private $db;

    public function __construct() {
        $dba = new DBAccess();
        $this->db = $dba->getConnection();
    }

    public function createOrder($userId, $subtotal, $taxAmount, $total, $discountAmount, $shippingAddress, $paymentMethod, $paymentDetails) {
            $stmt = $this->db->prepare("
                INSERT INTO orders
                    (user_id, status, subtotal, tax_amount, total, discount_amount, shipping_address, payment_method, payment_details)
                VALUES
                    (:user_id, 'pending', :subtotal, :tax_amount, :total, :discount_amount, :shipping_address, :payment_method, :payment_details)
            ");
            $stmt->execute([
                ':user_id'          => $userId,
                ':subtotal'         => $subtotal,
                ':tax_amount'       => $taxAmount,
                ':total'            => $total,
                ':discount_amount'  => $discountAmount,
                ':shipping_address' => $shippingAddress,
                ':payment_method'   => $paymentMethod,
                ':payment_details'  => $paymentDetails
            ]);
            return $this->db->lastInsertId();
        }

    public function createOrderItems($orderId, $items) {
        $stmt = $this->db->prepare("
            INSERT INTO order_items 
                (order_id, product_id, product_name, quantity, unit_price, total)
            VALUES 
                (:order_id, :product_id, :product_name, :quantity, :unit_price, :total)
        ");
        foreach ($items as $item) {
            $stmt->execute([
                ':order_id'     => $orderId,
                ':product_id'   => $item['product_id'],
                ':product_name' => $item['product_name'],
                ':quantity'     => $item['quantity'],
                ':unit_price'   => $item['unit_price'],
                ':total'        => $item['total']
            ]);
        }
    }

    public function getOrdersByUserId($userId) {
        $stmt = $this->db->prepare("
            SELECT
                id,
                status,
                total,
                created_at
            FROM orders
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        ");

        $stmt->execute([
            ':user_id' => $userId
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOrderById($order_id){
        //get Order Details
        $order = $this->db->prepare("SELECT orders.*, users.firstname, users.lastname, users.gender FROM orders JOIN users ON orders.user_id = users.user_id WHERE orders.id = :order_id");
        $order->execute([':order_id' => $order_id]);
        $order = $order->fetch(PDO::FETCH_ASSOC);
        //get products
        $items = $this->db->prepare("SELECT id AS order_item_id, order_id, product_id, product_name, quantity, unit_price, total FROM order_items WHERE order_id = :order_id");
        $items->execute([':order_id' => $order_id]);
        $items = $items->fetchAll(PDO::FETCH_ASSOC);
        return [
            'order' => $order,
            'items' => $items
        ];
    }

    public function getOrdersByCustomerForAdmin($data) {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            return ["success" => false, "message" => "Unauthorized access. Admins only."];
        }

        if (!isset($data['userId'])) {
            return ["success" => false, "message" => "Missing user ID."];
        }

        try {
            $stmt = $this->db->prepare("SELECT id, status, total, created_at FROM orders WHERE user_id = :user_id ORDER BY created_at DESC");

            $stmt->execute([
                ':user_id' => $data['userId']
            ]);

            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["success" => true, "data" => $orders];

        } catch (PDOException $e) {
            return ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }
    }

    public function getOrderDetailsForAdmin($data) {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            return ["success" => false, "message" => "Unauthorized access. Admins only."];
        }

        if (!isset($data['orderId'])) {
            return ["success" => false, "message" => "Missing order ID."];
        }

        try {
            $orderDetails = $this->getOrderById($data['orderId']);

            if (!$orderDetails['order']) {
                return ["success" => false, "message" => "Order not found."];
            }

            return ["success" => true, "data" => $orderDetails];

        } catch (PDOException $e) {
            return ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }
    }

    public function removeOrderItemFromOrder($data) {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            return ["success" => false, "message" => "Unauthorized access. Admins only."];
        }

        if (!isset($data['orderId']) || !isset($data['orderItemId'])) {
            return ["success" => false, "message" => "Missing order ID or order item ID."];
        }

        $orderId = $data['orderId'];
        $orderItemId = $data['orderItemId'];

        try {
            $this->db->beginTransaction();
            $checkStmt = $this->db->prepare("SELECT total FROM order_items WHERE id = :order_item_id AND order_id = :order_id");

            $checkStmt->execute([
                ':order_item_id' => $orderItemId,
                ':order_id' => $orderId
            ]);

            $item = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$item) {
                $this->db->rollBack();
                return ["success" => false, "message" => "Order item not found."];
            }

            $deleteStmt = $this->db->prepare("DELETE FROM order_items WHERE id = :order_item_id AND order_id = :order_id");

            $deleteStmt->execute([
                ':order_item_id' => $orderItemId,
                ':order_id' => $orderId
            ]);

            $sumStmt = $this->db->prepare("SELECT COUNT(*) AS remaining_items, COALESCE(SUM(total), 0) AS new_subtotal FROM order_items WHERE order_id = :order_id");

            $sumStmt->execute([
                ':order_id' => $orderId
            ]);

            $sumResult = $sumStmt->fetch(PDO::FETCH_ASSOC);
            $remainingItems = (int)$sumResult['remaining_items'];
            $newSubtotal = (float)$sumResult['new_subtotal'];

            $orderStmt = $this->db->prepare("SELECT discount_amount FROM orders WHERE id = :order_id");

            $orderStmt->execute([
                ':order_id' => $orderId
            ]);

            $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
            $discountAmount = $order ? (float)$order['discount_amount'] : 0;

            if ($remainingItems === 0) {
                $discountAmount = 0;
            }

            if ($discountAmount > $newSubtotal) {
                $discountAmount = $newSubtotal;
            }

            $newTotal = $newSubtotal - $discountAmount;

            // VAT is included in the total price: 20 / 120
            $newTaxAmount = $newTotal * 20 / 120;

            $updateStmt = $this->db->prepare("UPDATE orders SET subtotal = :subtotal, tax_amount = :tax_amount, total = :total, discount_amount = :discount_amount, status = CASE WHEN :remaining_items = 0 THEN 'cancelled' ELSE status END WHERE id = :order_id");
            $updateStmt->execute([
                ':subtotal' => number_format($newSubtotal, 2, '.', ''),
                ':tax_amount' => number_format($newTaxAmount, 2, '.', ''),
                ':total' => number_format($newTotal, 2, '.', ''),
                ':discount_amount' => number_format($discountAmount, 2, '.', ''),
                ':remaining_items' => $remainingItems,
                ':order_id' => $orderId
            ]);

            $this->db->commit();

            if ($remainingItems === 0) {
                return ["success" => true, "message" => "Product was removed. The order has no products left and was cancelled."];
            }

            return ["success" => true, "message" => "Product was removed from the order."];

        } catch (PDOException $e) {
            $this->db->rollBack();
            return ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }
    }
}