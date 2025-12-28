CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`machineId` int,
	`customizations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `machines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineCode` varchar(32) NOT NULL,
	`name` varchar(128) NOT NULL,
	`address` text,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`status` enum('online','offline','maintenance') NOT NULL DEFAULT 'online',
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `machines_id` PRIMARY KEY(`id`),
	CONSTRAINT `machines_machineCode_unique` UNIQUE(`machineCode`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('order','promo','system','bonus') NOT NULL DEFAULT 'system',
	`title` varchar(128) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`data` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`machineId` int NOT NULL,
	`items` json NOT NULL,
	`subtotal` int NOT NULL,
	`discount` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`paymentMethod` enum('click','payme','uzum','telegram','cash','bonus') NOT NULL,
	`paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`telegramPaymentChargeId` varchar(128),
	`status` enum('pending','confirmed','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
	`promoCode` varchar(32),
	`promoDiscount` int DEFAULT 0,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`pointsUsed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`nameRu` varchar(128),
	`description` text,
	`descriptionRu` text,
	`category` enum('coffee','tea','snacks','cold_drinks','other') NOT NULL DEFAULT 'coffee',
	`price` int NOT NULL,
	`imageUrl` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isPopular` boolean NOT NULL DEFAULT false,
	`calories` int,
	`volume` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`discountPercent` int NOT NULL,
	`maxUses` int,
	`currentUses` int NOT NULL DEFAULT 0,
	`minOrderAmount` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promo_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promo_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `telegramId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramUsername` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramFirstName` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramLastName` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramPhotoUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `pointsBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `loyaltyLevel` enum('bronze','silver','gold','platinum') DEFAULT 'bronze' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalSpent` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalOrders` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_telegramId_unique` UNIQUE(`telegramId`);