import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with Telegram-specific fields for TWA integration.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Telegram-specific fields
  telegramId: varchar("telegramId", { length: 64 }).unique(),
  telegramUsername: varchar("telegramUsername", { length: 64 }),
  telegramFirstName: varchar("telegramFirstName", { length: 128 }),
  telegramLastName: varchar("telegramLastName", { length: 128 }),
  telegramPhotoUrl: text("telegramPhotoUrl"),
  
  // Loyalty program
  pointsBalance: int("pointsBalance").default(0).notNull(),
  loyaltyLevel: mysqlEnum("loyaltyLevel", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
  totalSpent: int("totalSpent").default(0).notNull(),
  totalOrders: int("totalOrders").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Vending machines/locations table
 */
export const machines = mysqlTable("machines", {
  id: int("id").autoincrement().primaryKey(),
  machineCode: varchar("machineCode", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  status: mysqlEnum("status", ["online", "offline", "maintenance"]).default("online").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Machine = typeof machines.$inferSelect;
export type InsertMachine = typeof machines.$inferInsert;

/**
 * Products/drinks catalog
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  nameRu: varchar("nameRu", { length: 128 }),
  description: text("description"),
  descriptionRu: text("descriptionRu"),
  category: mysqlEnum("category", ["coffee", "tea", "snacks", "cold_drinks", "other"]).default("coffee").notNull(),
  price: int("price").notNull(), // Price in UZS
  imageUrl: text("imageUrl"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  isPopular: boolean("isPopular").default(false).notNull(),
  calories: int("calories"),
  volume: int("volume"), // in ml
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * User favorites
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Shopping cart items
 */
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  machineId: int("machineId"),
  customizations: json("customizations"), // JSON for size, sugar, milk, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * Orders table
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  machineId: int("machineId").notNull(),
  
  // Order details
  items: json("items").notNull(), // JSON array of ordered items
  subtotal: int("subtotal").notNull(),
  discount: int("discount").default(0).notNull(),
  total: int("total").notNull(),
  
  // Payment info
  paymentMethod: mysqlEnum("paymentMethod", ["click", "payme", "uzum", "telegram", "cash", "bonus"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  telegramPaymentChargeId: varchar("telegramPaymentChargeId", { length: 128 }),
  
  // Order status
  status: mysqlEnum("status", ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]).default("pending").notNull(),
  
  // Promo code
  promoCode: varchar("promoCode", { length: 32 }),
  promoDiscount: int("promoDiscount").default(0),
  
  // Points
  pointsEarned: int("pointsEarned").default(0).notNull(),
  pointsUsed: int("pointsUsed").default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Promo codes
 */
export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  discountPercent: int("discountPercent").notNull(),
  maxUses: int("maxUses"),
  currentUses: int("currentUses").default(0).notNull(),
  minOrderAmount: int("minOrderAmount").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

/**
 * User notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["order", "promo", "system", "bonus"]).default("system").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  data: json("data"), // Additional data like orderId, promoCode, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Machine inventory - tracks product stock levels per machine
 */
export const machineInventory = mysqlTable("machine_inventory", {
  id: int("id").autoincrement().primaryKey(),
  machineId: int("machineId").notNull(),
  productId: int("productId").notNull(),
  currentStock: int("currentStock").default(0).notNull(),
  maxCapacity: int("maxCapacity").default(100).notNull(),
  lowStockThreshold: int("lowStockThreshold").default(10).notNull(),
  lastRestocked: timestamp("lastRestocked"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MachineInventory = typeof machineInventory.$inferSelect;
export type InsertMachineInventory = typeof machineInventory.$inferInsert;

/**
 * Machine maintenance logs
 */
export const maintenanceLogs = mysqlTable("maintenance_logs", {
  id: int("id").autoincrement().primaryKey(),
  machineId: int("machineId").notNull(),
  type: mysqlEnum("type", ["routine", "repair", "restock", "cleaning", "other"]).default("routine").notNull(),
  description: text("description"),
  performedBy: varchar("performedBy", { length: 128 }),
  cost: int("cost").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type InsertMaintenanceLog = typeof maintenanceLogs.$inferInsert;


/**
 * Gamification tasks - defines available tasks users can complete for points
 */
export const gamificationTasks = mysqlTable("gamification_tasks", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 128 }).notNull(),
  titleRu: varchar("titleRu", { length: 128 }),
  description: text("description"),
  descriptionRu: text("descriptionRu"),
  
  // Task type and action
  taskType: mysqlEnum("taskType", [
    "link_telegram",    // Link Telegram account
    "link_email",       // Add email address
    "first_order",      // Complete first order
    "order_count",      // Complete X orders
    "spend_amount",     // Spend X amount
    "referral",         // Refer a friend
    "daily_login",      // Daily app visit
    "review",           // Leave a review
    "social_share",     // Share on social media
    "custom"            // Custom task defined by admin
  ]).notNull(),
  
  // Points reward
  pointsReward: int("pointsReward").notNull(),
  
  // Task requirements
  requiredValue: int("requiredValue").default(1), // e.g., 5 orders, 100000 UZS spent
  
  // Repeatability
  isRepeatable: boolean("isRepeatable").default(false).notNull(),
  repeatCooldownHours: int("repeatCooldownHours"), // Hours before task can be repeated
  maxCompletions: int("maxCompletions"), // Max times a user can complete this task
  
  // Display
  iconName: varchar("iconName", { length: 64 }), // Lucide icon name
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  
  // Validity period
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GamificationTask = typeof gamificationTasks.$inferSelect;
export type InsertGamificationTask = typeof gamificationTasks.$inferInsert;

/**
 * User task completions - tracks which tasks users have completed
 */
export const userTaskCompletions = mysqlTable("user_task_completions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: int("taskId").notNull(),
  
  // Progress tracking
  currentProgress: int("currentProgress").default(0).notNull(), // For progressive tasks
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completionCount: int("completionCount").default(0).notNull(), // Times completed
  
  // Points awarded
  pointsAwarded: int("pointsAwarded").default(0).notNull(),
  
  completedAt: timestamp("completedAt"),
  lastProgressAt: timestamp("lastProgressAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserTaskCompletion = typeof userTaskCompletions.$inferSelect;
export type InsertUserTaskCompletion = typeof userTaskCompletions.$inferInsert;

/**
 * Points transactions - logs all point earnings and spendings
 */
export const pointsTransactions = mysqlTable("points_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Transaction details
  amount: int("amount").notNull(), // Positive for earn, negative for spend
  type: mysqlEnum("type", [
    "task_completion",  // Points from completing a task
    "order_reward",     // Points from placing an order
    "referral_bonus",   // Points from referral
    "admin_adjustment", // Manual adjustment by admin
    "redemption",       // Points spent on rewards
    "expiration"        // Points expired
  ]).notNull(),
  
  // Reference to related entity
  referenceType: varchar("referenceType", { length: 32 }), // 'task', 'order', 'referral', etc.
  referenceId: int("referenceId"),
  
  // Balance after transaction
  balanceAfter: int("balanceAfter").notNull(),
  
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = typeof pointsTransactions.$inferInsert;

/**
 * User preferences - stores user's homepage customization settings
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Homepage sections configuration
  // JSON array of section configs: [{id, visible, size, order}]
  homeSections: json("homeSections"),
  
  // Other preferences
  language: varchar("language", { length: 8 }).default("ru"),
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("system"),
  notificationsEnabled: boolean("notificationsEnabled").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;


/**
 * Referrals - tracks user referrals and rewards
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  
  // Referrer (the user who invited)
  referrerId: int("referrerId").notNull(),
  referrerCode: varchar("referrerCode", { length: 16 }).notNull(),
  
  // Referred user (the new user who joined)
  referredUserId: int("referredUserId").unique(),
  
  // Status tracking
  status: mysqlEnum("status", [
    "pending",      // Link clicked but user not registered
    "registered",   // User registered but not completed action
    "completed",    // Referral completed, points awarded
    "expired"       // Referral link expired
  ]).default("pending").notNull(),
  
  // Points awarded
  referrerPointsAwarded: int("referrerPointsAwarded").default(0).notNull(),
  referredPointsAwarded: int("referredPointsAwarded").default(0).notNull(),
  
  // Tracking
  clickCount: int("clickCount").default(0).notNull(),
  
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Referral codes - unique codes for each user
 */
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  
  // Statistics
  totalClicks: int("totalClicks").default(0).notNull(),
  totalReferrals: int("totalReferrals").default(0).notNull(),
  totalPointsEarned: int("totalPointsEarned").default(0).notNull(),
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;
