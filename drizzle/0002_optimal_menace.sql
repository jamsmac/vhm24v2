CREATE TABLE `import_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` varchar(64) NOT NULL,
	`fileName` varchar(256) NOT NULL,
	`fileType` varchar(32) NOT NULL,
	`fileSize` int DEFAULT 0,
	`recordCount` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`errorCount` int NOT NULL DEFAULT 0,
	`importStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`importedBy` int,
	`errors` json,
	`dateRangeStart` timestamp,
	`dateRangeEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `import_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_batches_batchId_unique` UNIQUE(`batchId`)
);
--> statement-breakpoint
CREATE TABLE `inventory_check_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkId` int NOT NULL,
	`checkItemType` enum('ingredient','cleaning','spare_part') NOT NULL,
	`itemId` int NOT NULL,
	`expectedQuantity` int NOT NULL,
	`actualQuantity` int,
	`discrepancy` int,
	`discrepancyReason` text,
	`countedBy` int,
	`countedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_check_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkNumber` varchar(32) NOT NULL,
	`checkType` enum('full','partial','spot') NOT NULL DEFAULT 'full',
	`checkStatus` enum('draft','in_progress','completed','approved') NOT NULL DEFAULT 'draft',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`approvedAt` timestamp,
	`approvedBy` int,
	`conductedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_checks_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_checks_checkNumber_unique` UNIQUE(`checkNumber`)
);
--> statement-breakpoint
CREATE TABLE `product_recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`quantity` int NOT NULL,
	`unit` varchar(16) NOT NULL DEFAULT 'g',
	`isOptional` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(64) NOT NULL,
	`operatorNumber` varchar(64),
	`productName` varchar(128) NOT NULL,
	`flavorName` varchar(128),
	`orderResource` varchar(64),
	`orderType` varchar(64),
	`paymentStatus` varchar(64),
	`cupType` varchar(16),
	`machineCode` varchar(64),
	`address` varchar(256),
	`orderPrice` int NOT NULL DEFAULT 0,
	`brewingStatus` varchar(64),
	`createdTime` timestamp,
	`paymentTime` timestamp,
	`brewingTime` timestamp,
	`deliveryTime` timestamp,
	`refundTime` timestamp,
	`paymentCard` varchar(64),
	`reason` text,
	`notes` text,
	`importBatchId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warehouse_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`code` varchar(16) NOT NULL,
	`description` text,
	`capacity` int,
	`currentOccupancy` int DEFAULT 0,
	`zoneType` enum('ingredients','cleaning','spare_parts','mixed','cold_storage') NOT NULL DEFAULT 'mixed',
	`temperature` varchar(32),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouse_zones_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouse_zones_code_unique` UNIQUE(`code`)
);
