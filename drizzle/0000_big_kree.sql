CREATE TABLE `bunkers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`ingredientId` int,
	`bunkerNumber` int NOT NULL,
	`capacity` int NOT NULL,
	`currentLevel` int NOT NULL DEFAULT 0,
	`lowLevelThreshold` int NOT NULL DEFAULT 20,
	`lastRefillDate` timestamp,
	`lastRefillBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bunkers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `cleaning_supplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`cleaningCategory` enum('detergent','sanitizer','descaler','brush','cloth','other') NOT NULL DEFAULT 'other',
	`unit` varchar(32) NOT NULL DEFAULT 'pcs',
	`costPerUnit` int NOT NULL DEFAULT 0,
	`minStockLevel` int NOT NULL DEFAULT 10,
	`usageFrequency` varchar(64),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cleaning_supplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractor_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractorId` int NOT NULL,
	`invoiceNumber` varchar(64) NOT NULL,
	`amount` int NOT NULL,
	`invoiceStatus` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`issueDate` timestamp NOT NULL,
	`dueDate` timestamp,
	`paidDate` timestamp,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractor_invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(256) NOT NULL,
	`contactPerson` varchar(128),
	`phone` varchar(32),
	`email` varchar(320),
	`address` text,
	`serviceType` enum('repair','supply','cleaning','installation','consulting','other') NOT NULL DEFAULT 'other',
	`contractStart` timestamp,
	`contractEnd` timestamp,
	`paymentTerms` varchar(128),
	`rating` int DEFAULT 0,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractors_id` PRIMARY KEY(`id`)
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
CREATE TABLE `employee_machine_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`machineId` int NOT NULL,
	`assignmentType` enum('primary','backup','temporary') NOT NULL DEFAULT 'primary',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_machine_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(128) NOT NULL,
	`phone` varchar(32),
	`email` varchar(320),
	`username` varchar(64),
	`employeeRole` enum('owner','admin','manager','operator','collector','technician','viewer') NOT NULL DEFAULT 'viewer',
	`employeeStatus` enum('pending','active','inactive','suspended') NOT NULL DEFAULT 'pending',
	`telegramUserId` varchar(64),
	`telegramUsername` varchar(128),
	`hireDate` timestamp NOT NULL DEFAULT (now()),
	`salary` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
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
CREATE TABLE `ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`ingredientCategory` enum('coffee','milk','sugar','syrup','powder','water','other') NOT NULL DEFAULT 'other',
	`unit` varchar(32) NOT NULL DEFAULT 'g',
	`costPerUnit` int NOT NULL DEFAULT 0,
	`minStockLevel` int NOT NULL DEFAULT 100,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `machines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineCode` varchar(32) NOT NULL,
	`name` varchar(128) NOT NULL,
	`model` varchar(64),
	`serialNumber` varchar(64),
	`manufacturer` varchar(64),
	`address` text,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`groupId` int,
	`status` enum('online','offline','maintenance','inactive') NOT NULL DEFAULT 'online',
	`installationDate` timestamp,
	`lastMaintenanceDate` timestamp,
	`assignedEmployeeId` int,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `machines_id` PRIMARY KEY(`id`),
	CONSTRAINT `machines_machineCode_unique` UNIQUE(`machineCode`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`employeeId` int,
	`contractorId` int,
	`maintenanceType` enum('cleaning','repair','replacement','inspection','refill') NOT NULL,
	`description` text,
	`partsUsed` text,
	`cost` int DEFAULT 0,
	`scheduledDate` timestamp,
	`completedDate` timestamp,
	`maintenanceStatus` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mixers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`mixerNumber` int NOT NULL,
	`mixerType` enum('main','secondary','whisk','grinder') NOT NULL DEFAULT 'main',
	`mixerStatus` enum('operational','needs_cleaning','needs_repair','replaced') NOT NULL DEFAULT 'operational',
	`lastMaintenanceDate` timestamp,
	`lastMaintenanceBy` int,
	`totalCycles` int NOT NULL DEFAULT 0,
	`maxCyclesBeforeMaintenance` int NOT NULL DEFAULT 10000,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mixers_id` PRIMARY KEY(`id`)
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
CREATE TABLE `spare_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`partNumber` varchar(64),
	`partCategory` enum('motor','pump','valve','sensor','display','board','heating','other') NOT NULL DEFAULT 'other',
	`compatibleModels` text,
	`costPerUnit` int NOT NULL DEFAULT 0,
	`minStockLevel` int NOT NULL DEFAULT 2,
	`supplier` varchar(128),
	`warrantyMonths` int DEFAULT 0,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spare_parts_id` PRIMARY KEY(`id`),
	CONSTRAINT `spare_parts_partNumber_unique` UNIQUE(`partNumber`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`movementItemType` enum('ingredient','cleaning','spare_part') NOT NULL,
	`itemId` int NOT NULL,
	`movementType` enum('in','out','adjustment','transfer') NOT NULL,
	`quantity` int NOT NULL,
	`reason` varchar(256),
	`machineId` int,
	`employeeId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `warehouse_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemType` enum('ingredient','cleaning','spare_part','other') NOT NULL,
	`itemId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`location` varchar(64),
	`lastStockCheck` timestamp,
	`lastStockCheckBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouse_inventory_id` PRIMARY KEY(`id`)
);
