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
CREATE TABLE `daily_quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questKey` varchar(64) NOT NULL,
	`title` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`type` enum('order','spend','visit','share','review','referral') NOT NULL,
	`targetValue` int NOT NULL,
	`rewardPoints` int NOT NULL,
	`isWeekly` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_quests_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_quests_questKey_unique` UNIQUE(`questKey`)
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
	`type` enum('order','promo','system','bonus','points') NOT NULL DEFAULT 'system',
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
CREATE TABLE `points_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('earn','spend','bonus','refund','expired') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`description` varchar(256) NOT NULL,
	`source` enum('order','welcome_bonus','first_order','referral','achievement','daily_quest','promo','admin','refund') NOT NULL,
	`referenceId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `points_transactions_id` PRIMARY KEY(`id`)
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
CREATE TABLE `user_daily_quest_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questId` int NOT NULL,
	`currentValue` int NOT NULL DEFAULT 0,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`rewardClaimed` boolean NOT NULL DEFAULT false,
	`questDate` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_daily_quest_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`telegramId` varchar(64),
	`telegramUsername` varchar(64),
	`telegramFirstName` varchar(128),
	`telegramLastName` varchar(128),
	`telegramPhotoUrl` text,
	`pointsBalance` int NOT NULL DEFAULT 0,
	`loyaltyLevel` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`totalSpent` int NOT NULL DEFAULT 0,
	`totalOrders` int NOT NULL DEFAULT 0,
	`welcomeBonusReceived` boolean NOT NULL DEFAULT false,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastQuestCompletedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_telegramId_unique` UNIQUE(`telegramId`)
);
