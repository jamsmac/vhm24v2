CREATE TABLE `machine_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`productId` int NOT NULL,
	`currentStock` int NOT NULL DEFAULT 0,
	`maxCapacity` int NOT NULL DEFAULT 100,
	`lowStockThreshold` int NOT NULL DEFAULT 10,
	`lastRestocked` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `machine_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`type` enum('routine','repair','restock','cleaning','other') NOT NULL DEFAULT 'routine',
	`description` text,
	`performedBy` varchar(128),
	`cost` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenance_logs_id` PRIMARY KEY(`id`)
);
