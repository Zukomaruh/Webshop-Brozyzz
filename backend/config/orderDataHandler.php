<?php
require_once "dbaccess.php";

class OrderDataHandler {
    private $db;

    public function __construct() {
        $dba = new DBAccess();
        $this->db = $dba->getConnection();
    }

    public function createOrder($userId, $subtotal, $taxAmount, $total, $couponCode, $discountAmount, $shippingAddress) {
        $stmt = $this->db->prepare("
            INSERT INTO orders 
                (user_id, status, subtotal, tax_amount, total, coupon_code, discount_amount, shipping_address)
            VALUES 
                (:user_id, 'pending', :subtotal, :tax_amount, :total, :coupon_code, :discount_amount, :shipping_address)
        ");
        $stmt->execute([
            ':user_id'          => $userId,
            ':subtotal'         => $subtotal,
            ':tax_amount'       => $taxAmount,
            ':total'            => $total,
            ':coupon_code'      => $couponCode,
            ':discount_amount'  => $discountAmount,
            ':shipping_address' => $shippingAddress
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
        $items = $this->db->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
        $items->execute([':order_id' => $order_id]);
        $items = $items->fetchAll(PDO::FETCH_ASSOC);
        return [
            'order' => $order,
            'items' => $items
        ];
    }
}