<?php
require_once "../config/productDataHandler.php";

class CartLogic {
    private $pdh;

    public function __construct() {
        $this->pdh = new ProductDataHandler();
    }

    public function handleRequest($method, $data) {
        switch ($method) {
            case "addToCart":
                return $this->addToCart($data['productId']);
            case "getCart":
                return $this->getCart();
            case "getCartCount":
                return $this->getCartCount();
            case "changeQuantity":
                return $this->changeQuantity($data['productId'], $data['delta']);
            case "removeFromCart":
                return $this->removeFromCart($data['productId']);
            default:
                return null;
        }
    }

    private function addToCart($id) {
        if (!isset($_SESSION['cart'])) { $_SESSION['cart'] = []; }

        // Wenn Produkt schon drin, Anzahl +1, sonst auf 1 setzen
        if (isset($_SESSION['cart'][$id])) {
            $_SESSION['cart'][$id]++;
        } else {
            $_SESSION['cart'][$id] = 1;
        }
        return ["success" => true];
    }

    private function getCart() {
        if (!isset($_SESSION['cart']) || empty($_SESSION['cart'])) {
            return [];
        }

        $cartItems = [];
        foreach ($_SESSION['cart'] as $id => $quantity) {
            // Wir holen uns die echten Produktdaten aus der DB
            $product = $this->pdh->getProductById($id);
            if ($product) {
                $product['quantity'] = $quantity;
                $cartItems[] = $product;
            }
        }
        return $cartItems;
    }

    private function getCartCount() {
        $count = 0;
        if (isset($_SESSION['cart'])) {
            foreach ($_SESSION['cart'] as $qty) {
                $count += $qty;
            }
        }
        return ["count" => $count];
    }

    private function changeQuantity($id, $delta) {
        if (isset($_SESSION['cart'][$id])) {
            $newQty = $_SESSION['cart'][$id] + (int)$delta;
            //Untergrenze 1 einhalten, null produkte nur durch removeFromCart möglich
            if ($newQty >= 1) {
                $_SESSION['cart'][$id] = $newQty;
            }
        }
        return ["success" => true];
    }

    private function removeFromCart($id) {
        if (isset($_SESSION['cart'][$id])) {
            unset($_SESSION['cart'][$id]);
        }
        return ["success" => true];
    }
}