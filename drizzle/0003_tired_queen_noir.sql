CREATE TABLE `gamification_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`title` varchar(128) NOT NULL,
	`titleRu` varchar(128),
	`description` text,
	`descriptionRu` text,
	`taskType` enum('link_telegram','link_email','first_order','order_count','spend_amount','referral','daily_login','review','social_share','custom') NOT NULL,
	`pointsReward` int NOT NULL,
	`requiredValue` int DEFAULT 1,
	`isRepeatable` boolean NOT NULL DEFAULT false,
	`repeatCooldownHours` int,
	`maxCompletions` int,
	`iconName` varchar(64),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gamification_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `gamification_tasks_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `points_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('task_completion','order_reward','referral_bonus','admin_adjustment','redemption','expiration') NOT NULL,
	`referenceType` varchar(32),
	`referenceId` int,
	`balanceAfter` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `points_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`homeSections` json,
	`language` varchar(8) DEFAULT 'ru',
	`theme` enum('light','dark','system') DEFAULT 'system',
	`notificationsEnabled` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_task_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` int NOT NULL,
	`currentProgress` int NOT NULL DEFAULT 0,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completionCount` int NOT NULL DEFAULT 0,
	`pointsAwarded` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`lastProgressAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_task_completions_id` PRIMARY KEY(`id`)
);
