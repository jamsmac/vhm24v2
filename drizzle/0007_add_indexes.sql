-- Add database indexes for query optimization

-- Orders indexes
CREATE INDEX `idx_orders_user` ON `orders` (`userId`);
--> statement-breakpoint
CREATE INDEX `idx_orders_status` ON `orders` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_orders_created` ON `orders` (`createdAt`);
--> statement-breakpoint
CREATE INDEX `idx_orders_user_status` ON `orders` (`userId`, `status`);
--> statement-breakpoint
CREATE INDEX `idx_orders_machine` ON `orders` (`machineId`);
--> statement-breakpoint

-- Notifications indexes
CREATE INDEX `idx_notifications_user` ON `notifications` (`userId`);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user_read` ON `notifications` (`userId`, `isRead`);
--> statement-breakpoint
CREATE INDEX `idx_notifications_created` ON `notifications` (`createdAt`);
--> statement-breakpoint

-- Favorites indexes
CREATE INDEX `idx_favorites_user` ON `favorites` (`userId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_favorites_user_product` ON `favorites` (`userId`, `productId`);
--> statement-breakpoint

-- Cart items indexes
CREATE INDEX `idx_cart_user` ON `cart_items` (`userId`);
--> statement-breakpoint
CREATE INDEX `idx_cart_user_product` ON `cart_items` (`userId`, `productId`);
--> statement-breakpoint

-- Points transactions indexes
CREATE INDEX `idx_points_user` ON `points_transactions` (`userId`);
--> statement-breakpoint
CREATE INDEX `idx_points_source` ON `points_transactions` (`source`);
--> statement-breakpoint
CREATE INDEX `idx_points_created` ON `points_transactions` (`createdAt`);
--> statement-breakpoint

-- User daily quest progress indexes
CREATE INDEX `idx_quest_progress_user` ON `user_daily_quest_progress` (`usersId`);
--> statement-breakpoint
CREATE INDEX `idx_quest_progress_quest` ON `user_daily_quest_progress` (`questId`);
--> statement-breakpoint
CREATE INDEX `idx_quest_progress_user_quest` ON `user_daily_quest_progress` (`usersId`, `questId`);
--> statement-breakpoint

-- Sales records indexes
CREATE INDEX `idx_sales_machine` ON `sales_records` (`machineId`);
--> statement-breakpoint
CREATE INDEX `idx_sales_date` ON `sales_records` (`saleDate`);
--> statement-breakpoint
CREATE INDEX `idx_sales_product` ON `sales_records` (`productId`);
--> statement-breakpoint
CREATE INDEX `idx_sales_payment` ON `sales_records` (`paymentType`);
--> statement-breakpoint
CREATE INDEX `idx_sales_machine_date` ON `sales_records` (`machineId`, `saleDate`);
--> statement-breakpoint

-- Bunkers indexes
CREATE INDEX `idx_bunkers_machine` ON `bunkers` (`machineId`);
--> statement-breakpoint
CREATE INDEX `idx_bunkers_ingredient` ON `bunkers` (`ingredientId`);
--> statement-breakpoint

-- Mixers indexes
CREATE INDEX `idx_mixers_machine` ON `mixers` (`machineId`);
--> statement-breakpoint
CREATE INDEX `idx_mixers_type` ON `mixers` (`mixerTypeId`);
--> statement-breakpoint

-- Work logs indexes
CREATE INDEX `idx_worklogs_employee` ON `work_logs` (`employeeId`);
--> statement-breakpoint
CREATE INDEX `idx_worklogs_machine` ON `work_logs` (`machineId`);
--> statement-breakpoint
CREATE INDEX `idx_worklogs_date` ON `work_logs` (`startTime`);
--> statement-breakpoint
CREATE INDEX `idx_worklogs_employee_date` ON `work_logs` (`employeeId`, `startTime`);
--> statement-breakpoint
CREATE INDEX `idx_worklogs_machine_date` ON `work_logs` (`machineId`, `startTime`);
--> statement-breakpoint

-- Machine assignments indexes
CREATE INDEX `idx_assignments_machine` ON `machine_assignments` (`machineId`);
--> statement-breakpoint
CREATE INDEX `idx_assignments_employee` ON `machine_assignments` (`employeeId`);
--> statement-breakpoint
CREATE INDEX `idx_assignments_status` ON `machine_assignments` (`assignmentStatus`);
--> statement-breakpoint
CREATE INDEX `idx_assignments_employee_status` ON `machine_assignments` (`employeeId`, `assignmentStatus`);
--> statement-breakpoint
CREATE INDEX `idx_assignments_machine_status` ON `machine_assignments` (`machineId`, `assignmentStatus`);
--> statement-breakpoint

-- Tasks indexes
CREATE INDEX `idx_tasks_assignee` ON `tasks` (`assigneeId`);
--> statement-breakpoint
CREATE INDEX `idx_tasks_assigner` ON `tasks` (`assignerId`);
--> statement-breakpoint
CREATE INDEX `idx_tasks_status` ON `tasks` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_tasks_assignee_status` ON `tasks` (`assigneeId`, `status`);
--> statement-breakpoint
CREATE INDEX `idx_tasks_due` ON `tasks` (`dueDate`);
--> statement-breakpoint
CREATE INDEX `idx_tasks_machine` ON `tasks` (`machineId`);
--> statement-breakpoint

-- Maintenance history indexes
CREATE INDEX `idx_maintenance_machine` ON `maintenance_history` (`machineId`);
--> statement-breakpoint
CREATE INDEX `idx_maintenance_date` ON `maintenance_history` (`performedAt`);
--> statement-breakpoint
CREATE INDEX `idx_maintenance_type` ON `maintenance_history` (`maintenanceType`);
--> statement-breakpoint
CREATE INDEX `idx_maintenance_machine_date` ON `maintenance_history` (`machineId`, `performedAt`);
