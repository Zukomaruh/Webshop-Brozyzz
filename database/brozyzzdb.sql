-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 15. Jun 2026 um 17:30
-- Server-Version: 10.4.32-MariaDB
-- PHP-Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `brozyzzdb`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('pending','processing','shipped','delivered','cancelled','refunded') NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `shipping_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`shipping_address`)),
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_details` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `status`, `subtotal`, `tax_amount`, `total`, `discount_amount`, `shipping_address`, `payment_method`, `payment_details`, `created_at`, `updated_at`) VALUES
(1, 5, 'pending', 59.80, 9.97, 59.80, 0.00, '{\"address\":\"Hochstadtplatz 6\",\"zip\":\"1200\",\"city\":\"Wien\"}', NULL, NULL, '2026-05-30 11:59:33', '2026-05-30 13:32:03'),
(2, 5, 'processing', 34.30, 5.72, 34.30, 0.00, '{\"address\":\"Hochstadtplatz 67\",\"zip\":\"1200\",\"city\":\"Wien\"}', NULL, NULL, '2026-05-30 13:00:20', '2026-05-30 13:32:08'),
(3, 5, 'shipped', 4.90, 0.82, 4.90, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1200\",\"city\":\"Wien\"}', NULL, NULL, '2026-05-30 13:31:32', '2026-05-30 13:32:14'),
(4, 5, 'delivered', 29.90, 4.98, 29.90, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1200\",\"city\":\"Wien\"}', NULL, NULL, '2026-05-30 13:31:36', '2026-05-30 13:32:20'),
(5, 5, 'cancelled', 9.80, 1.63, 9.80, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1200\",\"city\":\"Wien\"}', NULL, NULL, '2026-05-30 13:31:40', '2026-05-30 13:32:24'),
(6, 5, 'refunded', 119.60, 19.93, 119.60, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1200\",\"city\":\"Wien\"}', NULL, NULL, '2026-05-30 13:31:47', '2026-05-30 13:32:29'),
(7, 5, 'pending', 29.90, 4.98, 29.90, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1200\",\"city\":\"Wien\"}', NULL, NULL, '2026-05-30 14:14:26', '2026-05-30 14:14:26'),
(8, 4, 'pending', 29.90, 4.98, 29.90, 0.00, '{\"address\":\"Baker Street\",\"zip\":\"123456\",\"city\":\"London\"}', NULL, NULL, '2026-05-30 14:25:32', '2026-05-30 14:25:32'),
(9, 5, 'pending', 358.80, 59.80, 358.80, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1200\",\"city\":\"Wien\"}', NULL, NULL, '2026-05-30 14:28:30', '2026-05-30 14:28:30'),
(10, 5, 'pending', 34.80, 5.80, 34.80, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1200\",\"city\":\"Wien\"}', NULL, NULL, '2026-05-30 14:34:15', '2026-05-30 14:34:15'),
(11, 6, 'pending', 4.90, 0.82, 4.90, 0.00, '{\"address\":\"2131\",\"zip\":\"213\",\"city\":\"123\"}', NULL, NULL, '2026-05-31 22:09:06', '2026-05-31 22:09:06'),
(12, 5, 'pending', 29.90, 4.98, 29.90, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1220\",\"city\":\"Wien\"}', NULL, NULL, '2026-06-08 21:43:21', '2026-06-08 21:43:21'),
(13, 4, 'pending', 69.99, 11.67, 69.99, 0.00, '{\"address\":\"Baker Street\",\"zip\":\"123456\",\"city\":\"London\"}', NULL, NULL, '2026-06-09 09:18:28', '2026-06-09 09:18:28'),
(14, 4, 'pending', 209.30, 34.88, 209.30, 0.00, '{\"address\":\"Baker Street\",\"zip\":\"123456\",\"city\":\"London\"}', NULL, NULL, '2026-06-09 13:35:32', '2026-06-09 13:35:32'),
(15, 4, 'pending', 0.00, 0.00, 0.00, 0.00, '{\"address\":\"Baker Street\",\"zip\":\"123456\",\"city\":\"London\"}', NULL, NULL, '2026-06-09 13:36:01', '2026-06-09 13:36:50'),
(16, 4, 'cancelled', 0.00, 0.00, 0.00, 0.00, '{\"address\":\"Baker Street\",\"zip\":\"123456\",\"city\":\"London\"}', NULL, NULL, '2026-06-09 13:56:48', '2026-06-09 14:07:00'),
(17, 5, 'cancelled', 0.00, 0.00, 0.00, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1220\",\"city\":\"Wien\"}', NULL, NULL, '2026-06-09 18:43:03', '2026-06-09 18:43:33'),
(18, 4, 'pending', 0.00, 0.00, 0.00, 0.00, '{\"address\":\"Baker Street\",\"zip\":\"123456\",\"city\":\"London\"}', NULL, NULL, '2026-06-09 19:16:27', '2026-06-09 19:16:27'),
(19, 6, 'pending', 29.90, 4.98, 29.90, 0.00, '{\"address\":\"Marienplatz 1\",\"zip\":\"2041\",\"city\":\"Maria Roggendorf\",\"payment_method\":\"creditcard\",\"payment_details\":\"****\"}', NULL, NULL, '2026-06-12 12:12:50', '2026-06-12 12:12:50'),
(20, 6, 'pending', 4.90, 0.00, 0.00, 4.90, '{\"address\":\"Marienplatz 1\",\"zip\":\"2041\",\"city\":\"Maria Roggendorf\",\"payment_method\":\"invoice\",\"payment_details\":null}', NULL, NULL, '2026-06-12 12:18:08', '2026-06-12 12:18:08'),
(21, 6, 'pending', 9.80, 0.00, 0.00, 9.80, '{\"address\":\"Marienplatz 1\",\"zip\":\"2041\",\"city\":\"Maria Roggendorf\",\"payment_method\":\"invoice\",\"payment_details\":null}', NULL, NULL, '2026-06-12 12:20:12', '2026-06-12 12:20:12'),
(22, 6, 'pending', 59.80, 9.08, 54.50, 5.30, '{\"address\":\"Marienplatz 1\",\"zip\":\"2041\",\"city\":\"Maria Roggendorf\",\"payment_method\":\"invoice\",\"payment_details\":null}', NULL, NULL, '2026-06-12 12:20:21', '2026-06-12 12:20:21'),
(23, 6, 'pending', 4.90, 0.00, 0.00, 4.90, '{\"address\":\"Marienplatz 1\",\"zip\":\"2041\",\"city\":\"Maria Roggendorf\",\"payment_method\":\"invoice\",\"payment_details\":null}', NULL, NULL, '2026-06-12 12:25:24', '2026-06-12 12:25:24'),
(24, 7, 'pending', 64.70, 10.78, 64.70, 0.00, '{\"address\":\"Klausstra\\u00dfe 1\",\"zip\":\"2020\",\"city\":\"Klaushausen\",\"payment_method\":\"creditcard\",\"payment_details\":\"****\"}', NULL, NULL, '2026-06-14 11:02:39', '2026-06-14 11:02:39'),
(25, 7, 'pending', 9.80, 1.63, 9.80, 0.00, '{\"address\":\"Klausstra\\u00dfe 1\",\"zip\":\"2020\",\"city\":\"Klaushausen\",\"payment_method\":\"invoice\",\"payment_details\":null}', NULL, NULL, '2026-06-14 11:52:02', '2026-06-14 11:52:02'),
(26, 5, 'pending', 69.60, 11.60, 69.60, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1220\",\"city\":\"Wien\"}', 'invoice', NULL, '2026-06-14 14:30:22', '2026-06-14 14:30:22'),
(27, 5, 'pending', 29.90, 4.98, 29.90, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1220\",\"city\":\"Wien\"}', 'invoice', NULL, '2026-06-14 14:30:37', '2026-06-14 14:30:37'),
(28, 5, 'pending', 29.90, 4.98, 29.90, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1220\",\"city\":\"Wien\"}', 'invoice', NULL, '2026-06-14 14:30:52', '2026-06-14 14:30:52'),
(29, 5, 'pending', 4.90, 0.82, 4.90, 0.00, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1220\",\"city\":\"Wien\"}', 'creditcard', '****', '2026-06-14 14:31:26', '2026-06-14 14:31:26'),
(30, 5, 'pending', 59.80, 9.97, 0.00, 59.80, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1220\",\"city\":\"Wien\"}', 'creditcard', '****', '2026-06-14 14:32:10', '2026-06-14 14:32:10'),
(31, 5, 'pending', 239.20, 39.87, 188.00, 51.20, '{\"address\":\"H\\u00f6chstadtplatz 67\",\"zip\":\"1220\",\"city\":\"Wien\"}', 'creditcard', '****', '2026-06-14 14:36:31', '2026-06-14 14:36:31'),
(32, 8, 'pending', 9.80, 1.63, 9.80, 0.00, '{\"address\":\"Marienplatz 1\",\"zip\":\"1111\",\"city\":\"Marioland\"}', 'invoice', NULL, '2026-06-14 14:38:45', '2026-06-14 14:38:45'),
(33, 8, 'pending', 29.90, 4.98, 29.90, 0.00, '{\"address\":\"Marienplatz 1\",\"zip\":\"1111\",\"city\":\"Marioland\"}', 'invoice', NULL, '2026-06-14 15:12:24', '2026-06-14 15:12:24'),
(34, 8, 'pending', 14.70, 2.45, 14.70, 0.00, '{\"address\":\"Marienplatz 1\",\"zip\":\"1111\",\"city\":\"Marioland\"}', 'creditcard', '****', '2026-06-14 15:14:45', '2026-06-14 15:14:45'),
(35, 8, 'pending', 29.90, 4.98, 7.90, 22.00, '{\"address\":\"Marienplatz 1\",\"zip\":\"1111\",\"city\":\"Marioland\"}', 'creditcard', '****', '2026-06-14 15:15:57', '2026-06-14 15:15:57'),
(36, 8, 'pending', 59.80, 9.97, 0.00, 59.80, '{\"address\":\"Marienplatz 1\",\"zip\":\"1111\",\"city\":\"Marioland\"}', 'creditcard', '****', '2026-06-14 15:23:48', '2026-06-14 15:23:48'),
(37, 8, 'pending', 29.90, 4.98, 0.00, 29.90, '{\"address\":\"Marienplatz 1\",\"zip\":\"1111\",\"city\":\"Marioland\"}', 'invoice', NULL, '2026-06-14 15:26:01', '2026-06-14 15:26:01'),
(38, 8, 'pending', 29.90, 4.98, 0.00, 29.90, '{\"address\":\"Marienplatz 1\",\"zip\":\"1111\",\"city\":\"Marioland\"}', 'creditcard', '****', '2026-06-14 16:22:04', '2026-06-14 16:22:04'),
(39, 9, 'pending', 34.80, 5.80, 34.80, 0.00, '{\"address\":\"Hauptplatz 1\",\"zip\":\"2020\",\"city\":\"Hollabrunn\"}', 'invoice', NULL, '2026-06-15 13:44:05', '2026-06-15 13:44:05'),
(40, 9, 'pending', 29.90, 0.00, 0.00, 29.90, '{\"address\":\"Hauptplatz 1\",\"zip\":\"2020\",\"city\":\"Hollabrunn\"}', 'creditcard', '****', '2026-06-15 13:46:53', '2026-06-15 13:47:17');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `total`) VALUES
(1, 1, 10, 'High Protein Nail Polish', 2, 29.90, 59.80),
(2, 2, 11, 'High Protein Cigarettes', 7, 4.90, 34.30),
(3, 3, 11, 'High Protein Cigarettes', 1, 4.90, 4.90),
(4, 4, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(5, 5, 11, 'High Protein Cigarettes', 2, 4.90, 9.80),
(6, 6, 10, 'High Protein Nail Polish', 4, 29.90, 119.60),
(7, 7, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(8, 8, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(9, 9, 10, 'High Protein Nail Polish', 12, 29.90, 358.80),
(10, 10, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(11, 10, 11, 'High Protein Cigarettes', 1, 4.90, 4.90),
(12, 11, 11, 'High Protein Cigarettes', 1, 4.90, 4.90),
(13, 12, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(14, 13, 12, 'TestProduct', 1, 69.99, 69.99),
(15, 14, 10, 'High Protein Nail Polish', 7, 29.90, 209.30),
(22, 19, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(23, 20, 11, 'High Protein Cigarettes', 1, 4.90, 4.90),
(24, 21, 11, 'High Protein Cigarettes', 2, 4.90, 9.80),
(25, 22, 10, 'High Protein Nail Polish', 2, 29.90, 59.80),
(26, 23, 11, 'High Protein Cigarettes', 1, 4.90, 4.90),
(27, 24, 10, 'High Protein Nail Polish', 2, 29.90, 59.80),
(28, 24, 11, 'High Protein Cigarettes', 1, 4.90, 4.90),
(29, 25, 11, 'High Protein Cigarettes', 2, 4.90, 9.80),
(30, 26, 10, 'High Protein Nail Polish', 2, 29.90, 59.80),
(31, 26, 11, 'High Protein Cigarettes', 2, 4.90, 9.80),
(32, 27, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(33, 28, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(34, 29, 11, 'High Protein Cigarettes', 1, 4.90, 4.90),
(35, 30, 10, 'High Protein Nail Polish', 2, 29.90, 59.80),
(36, 31, 10, 'High Protein Nail Polish', 8, 29.90, 239.20),
(37, 32, 11, 'High Protein Cigarettes', 2, 4.90, 9.80),
(38, 33, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(39, 34, 11, 'High Protein Cigarettes', 3, 4.90, 14.70),
(40, 35, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(41, 36, 10, 'High Protein Nail Polish', 2, 29.90, 59.80),
(42, 37, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(43, 38, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(44, 39, 11, 'High Protein Cigarettes', 1, 4.90, 4.90),
(45, 39, 10, 'High Protein Nail Polish', 1, 29.90, 29.90),
(46, 40, 10, 'High Protein Nail Polish', 1, 29.90, 29.90);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `method` enum('creditcard','invoice') NOT NULL,
  `details` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `user_id`, `method`, `details`, `is_default`) VALUES
(2, 5, 'creditcard', '222222222222222222', 0),
(3, 6, 'creditcard', '123456789', 0),
(7, 6, 'creditcard', '156156', 0),
(11, 7, 'creditcard', '989999991', 0),
(18, 8, 'invoice', NULL, 0),
(21, 9, 'creditcard', '12345678', 0);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `products`
--

CREATE TABLE `products` (
  `product_id` int(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `price` float NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Uncategorized',
  `rating` int(10) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `products`
--

INSERT INTO `products` (`product_id`, `name`, `description`, `price`, `category`, `rating`, `image`) VALUES
(10, 'High Protein Nail Polish', 'Nährwerte 30g Eiweiß auf 100g.', 29.9, 'Supplements', 5, 'product_69f89432766784.69692603.png'),
(11, 'High Protein Cigarettes', 'Beschreibung2', 5.9, 'Equipment', 3, 'product_69f89456397355.40889100.png');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `remember_tokens`
--

CREATE TABLE `remember_tokens` (
  `token_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `shopping_cart`
--

CREATE TABLE `shopping_cart` (
  `cart_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `shopping_cart`
--

INSERT INTO `shopping_cart` (`cart_id`, `user_id`, `product_id`, `quantity`) VALUES
(71, 6, 10, 1),
(75, 4, 10, 2),
(76, 4, 11, 1);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `users`
--

CREATE TABLE `users` (
  `user_id` int(10) NOT NULL,
  `firstname` varchar(100) NOT NULL,
  `lastname` varchar(100) NOT NULL,
  `gender` varchar(20) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `zip` varchar(20) NOT NULL,
  `city` varchar(100) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `payment_details` varchar(255) DEFAULT NULL,
  `password` varchar(100) NOT NULL,
  `role` enum('user','admin') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `balance` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `users`
--

INSERT INTO `users` (`user_id`, `firstname`, `lastname`, `gender`, `username`, `email`, `address`, `zip`, `city`, `payment_method`, `payment_details`, `password`, `role`, `status`, `balance`) VALUES
(4, 'Admin', 'Admin', 'mr', 'admin', 'admin@brozyzz.com', 'Baker Street', '123456', 'London', 'invoice', '', '$2y$10$PRFPG8CtmqFeJJ3qUwx0QOyzYSDJKLWi4qvC9XDiBQav.Y9NSj53a', 'admin', 'active', 0.00),
(5, 'Johannes', 'Wirgler', 'mr', 'jowi', 'jowi@test.at', 'Höchstadtplatz 67', '1220', 'Wien', 'creditcard', '111111', '$2y$10$kS6IFZJxyn.ha/ybrg5uw.NRgxgshrMUIOLCB6la.fjivH.EGQhWq', 'user', 'active', 0.00),
(6, 'Maxime', 'Mustermensch', 'other', 'tesssst', 'test@gmx.net', 'Marienplatz 1', '2041', 'Maria Roggendorf', 'invoice', '', '$2y$10$54GMv/CZiNUzG17/qD5zseAK.VJHizz58t99BRyEeRw.Q7bCLymma', 'user', 'active', 95.10),
(7, 'Klaus', 'Klausinger', 'mr', 'klaus', 'klaus@gmx.at', 'Klausstraße 1', '2020', 'Klaushausen', 'invoice', '', '$2y$10$kUtSxJv3lX4mI0HPvbiXZOGX5lCoR/e5H2JOxx4EPTri6zdt4EMdq', 'user', 'active', 0.00),
(8, 'Martina', 'Musterfrau', 'mr', 'martina', 'martina@gmx.at', 'Marienplatz 1', '1111', 'Marioland', 'creditcard', '12345678910', '$2y$10$Vxn.kNapucVJTE3HzKikXux8wuKjobx1Q33.Za3J3sgVxX2xHF.56', 'user', 'active', 141.40),
(9, 'Jakob', 'Fahrninger', 'mr', 'jakob', 'jakob@gmx.at', 'Hauptplatz 1', '2020', 'Hollabrunn', 'invoice', '', '$2y$10$J7sOhos4lh2m72tSQqHMvelmFivnBl23Rv9zOULp8e8HA8dts8ixS', 'user', 'active', 0.00);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `vouchers`
--

CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL,
  `code` varchar(5) NOT NULL,
  `initial_value` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_redeemed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `vouchers`
--

INSERT INTO `vouchers` (`id`, `code`, `initial_value`, `created_at`, `expires_at`, `is_redeemed`) VALUES
(1, 'V9V2K', 20.00, '2026-06-12 14:17:33', '2031-06-12 14:17:33', 1),
(2, 'DJKDU', 100.00, '2026-06-12 14:25:03', '2031-06-12 14:25:03', 1),
(3, 'R31EE', 111.00, '2026-06-14 16:31:45', '2031-06-14 16:31:45', 1),
(4, 'KJBDS', 22.00, '2026-06-14 17:15:31', '2031-06-14 17:15:31', 1),
(5, 'ABQO0', 111.00, '2026-06-14 17:17:51', '2031-06-14 17:17:51', 1),
(6, 'SQFIT', 150.00, '2026-06-14 17:23:26', '2031-06-14 17:23:26', 1),
(7, 'UPF5C', 50.00, '2026-06-15 15:46:00', '2031-06-15 15:46:00', 1);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indizes für die Tabelle `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indizes für die Tabelle `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`);

--
-- Indizes für die Tabelle `remember_tokens`
--
ALTER TABLE `remember_tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD UNIQUE KEY `unique_token_hash` (`token_hash`),
  ADD KEY `user_id` (`user_id`);

--
-- Indizes für die Tabelle `shopping_cart`
--
ALTER TABLE `shopping_cart`
  ADD PRIMARY KEY (`cart_id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`);

--
-- Indizes für die Tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indizes für die Tabelle `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT für Tabelle `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT für Tabelle `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT für Tabelle `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT für Tabelle `remember_tokens`
--
ALTER TABLE `remember_tokens`
  MODIFY `token_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT für Tabelle `shopping_cart`
--
ALTER TABLE `shopping_cart`
  MODIFY `cart_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT für Tabelle `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT für Tabelle `vouchers`
--
ALTER TABLE `vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

--
-- Constraints der Tabelle `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD CONSTRAINT `payment_methods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `remember_tokens`
--
ALTER TABLE `remember_tokens`
  ADD CONSTRAINT `fk_remember_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
