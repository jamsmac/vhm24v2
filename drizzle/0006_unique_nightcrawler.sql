ALTER TABLE `user_rewards` RENAME COLUMN `purchasedAt` TO `claimedAt`;--> statement-breakpoint
ALTER TABLE `user_rewards` DROP INDEX `user_rewards_redemptionCode_unique`;--> statement-breakpoint
ALTER TABLE `rewards` MODIFY COLUMN `rewardType` enum('bonus_points','promo_code','free_drink','discount_percent','discount_fixed','custom') NOT NULL;--> statement-breakpoint
ALTER TABLE `rewards` ADD `pointsAwarded` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `rewards` ADD `promoCode` varchar(32);--> statement-breakpoint
ALTER TABLE `user_rewards` ADD `pointsAwarded` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_rewards` ADD `promoCode` varchar(32);--> statement-breakpoint
ALTER TABLE `rewards` DROP COLUMN `discountValue`;--> statement-breakpoint
ALTER TABLE `rewards` DROP COLUMN `productId`;--> statement-breakpoint
ALTER TABLE `rewards` DROP COLUMN `validityDays`;--> statement-breakpoint
ALTER TABLE `user_rewards` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `user_rewards` DROP COLUMN `redeemedAt`;--> statement-breakpoint
ALTER TABLE `user_rewards` DROP COLUMN `redeemedOrderId`;--> statement-breakpoint
ALTER TABLE `user_rewards` DROP COLUMN `expiresAt`;--> statement-breakpoint
ALTER TABLE `user_rewards` DROP COLUMN `redemptionCode`;