--TABLES

--ORDER OF CREATION:
--1) users
--2) status
--3) products
--4) favorites
--5) orders
--6) order_products

----------------------------USERS-------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `address` varchar(400) NOT NULL,
  `admin` varchar(5) NOT NULL,
  PRIMARY KEY (`id`)
);

---------------------------STATUS-------------------------------
CREATE TABLE IF NOT EXISTS `status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
);

-------------------------PRODUCTS-------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(2000) NOT NULL,
  `price` float NOT NULL,
  `stock` int NOT NULL,
  PRIMARY KEY (`id`)
);

---------------------------FAVORITES-------------------------------
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  PRIMARY KEY (`id`),
  foreign key (user_id) references users (id)
  ON DELETE CASCADE,
  foreign key (product_id) references products (id)
  ON DELETE CASCADE
);

---------------------------ORDERS-------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `status_id` int NOT NULL,
  `order_date` datetime default now(),
  `total_price` float NOT NULL,
  PRIMARY KEY (`id`),
  foreign key (user_id) references users (id)
  ON DELETE CASCADE,
  foreign key (status_id) references status (id)
  ON DELETE CASCADE
);

---------------------------ORDER_PRODUCTS-------------------------------
CREATE TABLE IF NOT EXISTS `order_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `amount` int NOT NULL,
  `price` float NOT NULL,
  PRIMARY KEY (`id`),
  foreign key (order_id) references orders (id)
  ON DELETE CASCADE,
  foreign key (product_id) references products (id)
  ON DELETE CASCADE
);




