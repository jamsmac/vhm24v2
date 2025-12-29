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
  welcomeBonusReceived: boolean("welcomeBonusReceived").default(false).notNull(),
  
  // Streak tracking
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastQuestCompletedDate: timestamp("lastQuestCompletedDate"),
  
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
  type: mysqlEnum("type", ["order", "promo", "system", "bonus", "points"]).default("system").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  data: json("data"), // Additional data like orderId, promoCode, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * Points transactions history
 */
export const pointsTransactions = mysqlTable("points_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["earn", "spend", "bonus", "refund", "expired"]).notNull(),
  amount: int("amount").notNull(), // Positive for earn, negative for spend
  balanceAfter: int("balanceAfter").notNull(),
  description: varchar("description", { length: 256 }).notNull(),
  source: mysqlEnum("source", ["order", "welcome_bonus", "first_order", "referral", "achievement", "daily_quest", "promo", "admin", "refund"]).notNull(),
  referenceId: varchar("referenceId", { length: 64 }), // Order ID, promo code, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = typeof pointsTransactions.$inferInsert;

/**
 * Daily quests definitions
 */
export const dailyQuests = mysqlTable("daily_quests", {
  id: int("id").autoincrement().primaryKey(),
  questKey: varchar("questKey", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["order", "spend", "visit", "share", "review", "referral"]).notNull(),
  targetValue: int("targetValue").notNull(), // e.g., 1 order, 50000 spend
  rewardPoints: int("rewardPoints").notNull(),
  isWeekly: boolean("isWeekly").default(false).notNull(), // Weekly quests have higher rewards
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyQuest = typeof dailyQuests.$inferSelect;
export type InsertDailyQuest = typeof dailyQuests.$inferInsert;

/**
 * User daily quest progress
 */
export const userDailyQuestProgress = mysqlTable("user_daily_quest_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questId: int("questId").notNull(),
  currentValue: int("currentValue").default(0).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  rewardClaimed: boolean("rewardClaimed").default(false).notNull(),
  questDate: timestamp("questDate").notNull(), // Date for which this progress applies
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserDailyQuestProgress = typeof userDailyQuestProgress.$inferSelect;
export type InsertUserDailyQuestProgress = typeof userDailyQuestProgress.$inferInsert;
