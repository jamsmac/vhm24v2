CREATE TABLE `employee_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`totalWorkLogs` int NOT NULL DEFAULT 0,
	`totalWorkHours` int NOT NULL DEFAULT 0,
	`completedTasks` int NOT NULL DEFAULT 0,
	`cancelledTasks` int NOT NULL DEFAULT 0,
	`averageRating` decimal(3,2) DEFAULT '0.00',
	`issuesReported` int NOT NULL DEFAULT 0,
	`issuesResolved` int NOT NULL DEFAULT 0,
	`activeMachines` int NOT NULL DEFAULT 0,
	`totalMachinesAssigned` int NOT NULL DEFAULT 0,
	`lastWorkDate` timestamp,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_performance_id` PRIMARY KEY(`id`),
	CONSTRAINT `employee_performance_employeeId_unique` UNIQUE(`employeeId`)
);
--> statement-breakpoint
CREATE TABLE `machine_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineId` int NOT NULL,
	`employeeId` int NOT NULL,
	`assignmentType` enum('primary','secondary','temporary') NOT NULL DEFAULT 'primary',
	`assignmentStatus` enum('active','inactive','pending') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`responsibilities` text,
	`notes` text,
	`assignedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `machine_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`machineId` int,
	`workType` enum('maintenance','refill','cleaning','repair','inspection','installation','other') NOT NULL,
	`workStatus` enum('in_progress','completed','cancelled') NOT NULL DEFAULT 'in_progress',
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`duration` int,
	`description` text,
	`notes` text,
	`issuesFound` text,
	`partsUsed` text,
	`photoUrls` text,
	`rating` int,
	`verifiedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_logs_id` PRIMARY KEY(`id`)
);
