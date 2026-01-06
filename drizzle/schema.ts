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
  role: mysqlEnum("role", ["user", "employee", "admin"]).default("user").notNull(),
  
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
  model: varchar("model", { length: 64 }),
  serialNumber: varchar("serialNumber", { length: 64 }),
  manufacturer: varchar("manufacturer", { length: 64 }),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  groupId: int("groupId"),
  status: mysqlEnum("status", ["online", "offline", "maintenance", "inactive"]).default("online").notNull(),
  installationDate: timestamp("installationDate"),
  lastMaintenanceDate: timestamp("lastMaintenanceDate"),
  assignedEmployeeId: int("assignedEmployeeId"),
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
  type: mysqlEnum("type", ["earn", "spend", "bonus", "points", "refund", "expired"]).notNull(),
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


/**
 * Employees table for staff management
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  username: varchar("username", { length: 64 }),
  role: mysqlEnum("employeeRole", ["platform_owner", "platform_admin", "org_owner", "org_admin", "manager", "supervisor", "operator", "technician", "collector", "warehouse_manager", "warehouse_worker", "accountant", "investor"]).default("operator").notNull(),
  status: mysqlEnum("employeeStatus", ["pending", "active", "inactive", "suspended"]).default("pending").notNull(),
  telegramUserId: varchar("telegramUserId", { length: 64 }),
  telegramUsername: varchar("telegramUsername", { length: 128 }),
  hireDate: timestamp("hireDate").defaultNow().notNull(),
  salary: int("salary").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Ingredients table for coffee/drink ingredients
 */
export const ingredients = mysqlTable("ingredients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  category: mysqlEnum("ingredientCategory", ["coffee", "milk", "sugar", "syrup", "powder", "water", "other"]).default("other").notNull(),
  unit: varchar("unit", { length: 32 }).default("g").notNull(), // g, ml, pcs
  costPerUnit: int("costPerUnit").default(0).notNull(), // in cents/tiyin
  minStockLevel: int("minStockLevel").default(100).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = typeof ingredients.$inferInsert;

/**
 * Cleaning supplies table
 */
export const cleaningSupplies = mysqlTable("cleaning_supplies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  category: mysqlEnum("cleaningCategory", ["detergent", "sanitizer", "descaler", "brush", "cloth", "other"]).default("other").notNull(),
  unit: varchar("unit", { length: 32 }).default("pcs").notNull(),
  costPerUnit: int("costPerUnit").default(0).notNull(),
  minStockLevel: int("minStockLevel").default(10).notNull(),
  usageFrequency: varchar("usageFrequency", { length: 64 }), // daily, weekly, monthly
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CleaningSupply = typeof cleaningSupplies.$inferSelect;
export type InsertCleaningSupply = typeof cleaningSupplies.$inferInsert;

/**
 * Bunkers (ingredient containers) table
 */
export const bunkers = mysqlTable("bunkers", {
  id: int("id").autoincrement().primaryKey(),
  machineId: int("machineId").notNull(),
  ingredientId: int("ingredientId"),
  bunkerNumber: int("bunkerNumber").notNull(), // Position in machine (1, 2, 3...)
  capacity: int("capacity").notNull(), // Max capacity in units
  currentLevel: int("currentLevel").default(0).notNull(), // Current fill level
  lowLevelThreshold: int("lowLevelThreshold").default(20).notNull(), // Percentage
  lastRefillDate: timestamp("lastRefillDate"),
  lastRefillBy: int("lastRefillBy"), // Employee ID
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bunker = typeof bunkers.$inferSelect;
export type InsertBunker = typeof bunkers.$inferInsert;

/**
 * Mixers table for machine mixing components
 */
export const mixers = mysqlTable("mixers", {
  id: int("id").autoincrement().primaryKey(),
  machineId: int("machineId").notNull(),
  mixerNumber: int("mixerNumber").notNull(), // Position in machine
  mixerType: mysqlEnum("mixerType", ["main", "secondary", "whisk", "grinder"]).default("main").notNull(),
  status: mysqlEnum("mixerStatus", ["operational", "needs_cleaning", "needs_repair", "replaced"]).default("operational").notNull(),
  lastMaintenanceDate: timestamp("lastMaintenanceDate"),
  lastMaintenanceBy: int("lastMaintenanceBy"), // Employee ID
  totalCycles: int("totalCycles").default(0).notNull(), // Usage counter
  maxCyclesBeforeMaintenance: int("maxCyclesBeforeMaintenance").default(10000).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Mixer = typeof mixers.$inferSelect;
export type InsertMixer = typeof mixers.$inferInsert;

/**
 * Spare parts table
 */
export const spareParts = mysqlTable("spare_parts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  partNumber: varchar("partNumber", { length: 64 }).unique(),
  category: mysqlEnum("partCategory", ["motor", "pump", "valve", "sensor", "display", "board", "heating", "other"]).default("other").notNull(),
  compatibleModels: text("compatibleModels"), // JSON array of machine models
  costPerUnit: int("costPerUnit").default(0).notNull(),
  minStockLevel: int("minStockLevel").default(2).notNull(),
  supplier: varchar("supplier", { length: 128 }),
  warrantyMonths: int("warrantyMonths").default(0),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SparePart = typeof spareParts.$inferSelect;
export type InsertSparePart = typeof spareParts.$inferInsert;

/**
 * Warehouse inventory table
 */
export const warehouseInventory = mysqlTable("warehouse_inventory", {
  id: int("id").autoincrement().primaryKey(),
  itemType: mysqlEnum("itemType", ["ingredient", "cleaning", "spare_part", "other"]).notNull(),
  itemId: int("itemId").notNull(), // References ingredients, cleaningSupplies, or spareParts
  quantity: int("quantity").default(0).notNull(),
  location: varchar("location", { length: 64 }), // Shelf/bin location
  lastStockCheck: timestamp("lastStockCheck"),
  lastStockCheckBy: int("lastStockCheckBy"), // Employee ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WarehouseInventory = typeof warehouseInventory.$inferSelect;
export type InsertWarehouseInventory = typeof warehouseInventory.$inferInsert;

/**
 * Stock movements table for tracking in/out
 */
export const stockMovements = mysqlTable("stock_movements", {
  id: int("id").autoincrement().primaryKey(),
  itemType: mysqlEnum("movementItemType", ["ingredient", "cleaning", "spare_part"]).notNull(),
  itemId: int("itemId").notNull(),
  movementType: mysqlEnum("movementType", ["in", "out", "adjustment", "transfer"]).notNull(),
  quantity: int("quantity").notNull(), // Positive for in, negative for out
  reason: varchar("reason", { length: 256 }),
  machineId: int("machineId"), // If moved to/from a machine
  employeeId: int("employeeId"), // Who performed the movement
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;

/**
 * Contractors table
 */
export const contractors = mysqlTable("contractors", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  serviceType: mysqlEnum("serviceType", ["repair", "supply", "cleaning", "installation", "consulting", "other"]).default("other").notNull(),
  contractStart: timestamp("contractStart"),
  contractEnd: timestamp("contractEnd"),
  paymentTerms: varchar("paymentTerms", { length: 128 }), // Net 30, etc.
  rating: int("rating").default(0), // 1-5 stars
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = typeof contractors.$inferInsert;

/**
 * Contractor invoices table
 */
export const contractorInvoices = mysqlTable("contractor_invoices", {
  id: int("id").autoincrement().primaryKey(),
  contractorId: int("contractorId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 64 }).notNull(),
  amount: int("amount").notNull(), // In cents/tiyin
  status: mysqlEnum("invoiceStatus", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  issueDate: timestamp("issueDate").notNull(),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractorInvoice = typeof contractorInvoices.$inferSelect;
export type InsertContractorInvoice = typeof contractorInvoices.$inferInsert;

/**
 * Machine maintenance history
 */
export const maintenanceHistory = mysqlTable("maintenance_history", {
  id: int("id").autoincrement().primaryKey(),
  machineId: int("machineId").notNull(),
  employeeId: int("employeeId"),
  contractorId: int("contractorId"),
  maintenanceType: mysqlEnum("maintenanceType", ["cleaning", "repair", "replacement", "inspection", "refill"]).notNull(),
  description: text("description"),
  partsUsed: text("partsUsed"), // JSON array of spare part IDs and quantities
  cost: int("cost").default(0), // Total cost
  scheduledDate: timestamp("scheduledDate"),
  completedDate: timestamp("completedDate"),
  status: mysqlEnum("maintenanceStatus", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceHistory = typeof maintenanceHistory.$inferSelect;
export type InsertMaintenanceHistory = typeof maintenanceHistory.$inferInsert;

/**
 * Employee-Machine assignments
 */
export const employeeMachineAssignments = mysqlTable("employee_machine_assignments", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  machineId: int("machineId").notNull(),
  assignmentType: mysqlEnum("assignmentType", ["primary", "backup", "temporary"]).default("primary").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmployeeMachineAssignment = typeof employeeMachineAssignments.$inferSelect;
export type InsertEmployeeMachineAssignment = typeof employeeMachineAssignments.$inferInsert;


/**
 * Sales records imported from vending machine reports
 */
export const salesRecords = mysqlTable("sales_records", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 64 }).notNull(),
  operatorNumber: varchar("operatorNumber", { length: 64 }),
  productName: varchar("productName", { length: 128 }).notNull(),
  flavorName: varchar("flavorName", { length: 128 }),
  orderResource: varchar("orderResource", { length: 64 }), // Payment type: Наличные, QR, VIP, etc.
  orderType: varchar("orderType", { length: 64 }),
  paymentStatus: varchar("paymentStatus", { length: 64 }),
  cupType: varchar("cupType", { length: 16 }),
  machineCode: varchar("machineCode", { length: 64 }),
  address: varchar("address", { length: 256 }),
  orderPrice: int("orderPrice").default(0).notNull(), // Price in UZS
  brewingStatus: varchar("brewingStatus", { length: 64 }),
  createdTime: timestamp("createdTime"),
  paymentTime: timestamp("paymentTime"),
  brewingTime: timestamp("brewingTime"),
  deliveryTime: timestamp("deliveryTime"),
  refundTime: timestamp("refundTime"),
  paymentCard: varchar("paymentCard", { length: 64 }),
  reason: text("reason"),
  notes: text("notes"),
  importBatchId: varchar("importBatchId", { length: 64 }), // To track which import batch this record belongs to
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalesRecord = typeof salesRecords.$inferSelect;
export type InsertSalesRecord = typeof salesRecords.$inferInsert;

/**
 * Import batches for tracking document uploads
 */
export const importBatches = mysqlTable("import_batches", {
  id: int("id").autoincrement().primaryKey(),
  batchId: varchar("batchId", { length: 64 }).notNull().unique(),
  fileName: varchar("fileName", { length: 256 }).notNull(),
  fileType: varchar("fileType", { length: 32 }).notNull(), // xlsx, csv, pdf, etc.
  fileSize: int("fileSize").default(0),
  recordCount: int("recordCount").default(0).notNull(),
  successCount: int("successCount").default(0).notNull(),
  errorCount: int("errorCount").default(0).notNull(),
  status: mysqlEnum("importStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  importedBy: int("importedBy"), // Employee ID
  errors: json("errors"), // Array of error messages
  dateRangeStart: timestamp("dateRangeStart"),
  dateRangeEnd: timestamp("dateRangeEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ImportBatch = typeof importBatches.$inferSelect;
export type InsertImportBatch = typeof importBatches.$inferInsert;

/**
 * Inventory checks (инвентаризация)
 */
export const inventoryChecks = mysqlTable("inventory_checks", {
  id: int("id").autoincrement().primaryKey(),
  checkNumber: varchar("checkNumber", { length: 32 }).notNull().unique(),
  checkType: mysqlEnum("checkType", ["full", "partial", "spot"]).default("full").notNull(),
  status: mysqlEnum("checkStatus", ["draft", "in_progress", "completed", "approved"]).default("draft").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"), // Employee ID
  conductedBy: int("conductedBy"), // Employee ID
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryCheck = typeof inventoryChecks.$inferSelect;
export type InsertInventoryCheck = typeof inventoryChecks.$inferInsert;

/**
 * Inventory check items (individual item counts)
 */
export const inventoryCheckItems = mysqlTable("inventory_check_items", {
  id: int("id").autoincrement().primaryKey(),
  checkId: int("checkId").notNull(),
  itemType: mysqlEnum("checkItemType", ["ingredient", "cleaning", "spare_part"]).notNull(),
  itemId: int("itemId").notNull(),
  expectedQuantity: int("expectedQuantity").notNull(), // System quantity
  actualQuantity: int("actualQuantity"), // Counted quantity
  discrepancy: int("discrepancy"), // Difference (actual - expected)
  discrepancyReason: text("discrepancyReason"),
  countedBy: int("countedBy"), // Employee ID
  countedAt: timestamp("countedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryCheckItem = typeof inventoryCheckItems.$inferSelect;
export type InsertInventoryCheckItem = typeof inventoryCheckItems.$inferInsert;

/**
 * Warehouse zones for better organization
 */
export const warehouseZones = mysqlTable("warehouse_zones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  description: text("description"),
  capacity: int("capacity"), // Max items/units
  currentOccupancy: int("currentOccupancy").default(0),
  zoneType: mysqlEnum("zoneType", ["ingredients", "cleaning", "spare_parts", "mixed", "cold_storage"]).default("mixed").notNull(),
  temperature: varchar("temperature", { length: 32 }), // For cold storage zones
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WarehouseZone = typeof warehouseZones.$inferSelect;
export type InsertWarehouseZone = typeof warehouseZones.$inferInsert;

/**
 * Product recipes - ingredients needed per product
 */
export const productRecipes = mysqlTable("product_recipes", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  ingredientId: int("ingredientId").notNull(),
  quantity: int("quantity").notNull(), // Amount of ingredient per serving
  unit: varchar("unit", { length: 16 }).default("g").notNull(),
  isOptional: boolean("isOptional").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductRecipe = typeof productRecipes.$inferSelect;
export type InsertProductRecipe = typeof productRecipes.$inferInsert;

/**
 * Tasks table for employee work assignments
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  taskType: mysqlEnum("taskType", ["maintenance", "refill", "cleaning", "repair", "inspection", "inventory", "other"]).default("other").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("taskStatus", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  
  // Assignments
  assignedTo: int("assignedTo"), // Employee ID
  createdBy: int("createdBy"), // Employee ID
  
  // Related entities
  machineId: int("machineId"), // Related machine
  inventoryCheckId: int("inventoryCheckId"), // Related inventory check
  
  // Timing
  dueDate: timestamp("dueDate"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  
  // Results
  notes: text("notes"),
  completionNotes: text("completionNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Task comments for communication
 */
export const taskComments = mysqlTable("task_comments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  employeeId: int("employeeId").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;


/**
 * Machine assignments - track which employees are assigned to which machines
 */
export const machineAssignments = mysqlTable("machine_assignments", {
  id: int("id").autoincrement().primaryKey(),
  machineId: int("machineId").notNull(),
  employeeId: int("employeeId").notNull(),
  assignmentType: mysqlEnum("assignmentType", ["primary", "secondary", "temporary"]).default("primary").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("active").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  responsibilities: text("responsibilities"), // JSON array of responsibilities
  notes: text("notes"),
  assignedBy: int("assignedBy"), // Employee ID who made the assignment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MachineAssignment = typeof machineAssignments.$inferSelect;
export type InsertMachineAssignment = typeof machineAssignments.$inferInsert;

/**
 * Work logs - track employee work activities and sessions
 */
export const workLogs = mysqlTable("work_logs", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  machineId: int("machineId"),
  workType: mysqlEnum("workType", ["maintenance", "refill", "cleaning", "repair", "inspection", "installation", "other"]).notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "cancelled"]).default("in_progress").notNull(),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  duration: int("duration"), // in minutes, calculated on completion
  description: text("description"),
  notes: text("notes"),
  issuesFound: text("issuesFound"), // JSON array of issues
  partsUsed: text("partsUsed"), // JSON array of parts
  photoUrls: text("photoUrls"), // JSON array of photo URLs
  rating: int("rating"), // 1-5 rating of work quality
  verifiedBy: int("verifiedBy"), // Employee ID who verified the work
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkLog = typeof workLogs.$inferSelect;
export type InsertWorkLog = typeof workLogs.$inferInsert;

/**
 * Employee performance metrics
 */
export const employeePerformance = mysqlTable("employee_performance", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().unique(),
  totalWorkLogs: int("totalWorkLogs").default(0).notNull(),
  totalWorkHours: int("totalWorkHours").default(0).notNull(), // in minutes
  completedTasks: int("completedTasks").default(0).notNull(),
  cancelledTasks: int("cancelledTasks").default(0).notNull(),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }), // Average work rating
  issuesReported: int("issuesReported").default(0).notNull(),
  issuesResolved: int("issuesResolved").default(0).notNull(),
  activeMachines: int("activeMachines").default(0).notNull(), // Currently assigned machines
  totalMachinesAssigned: int("totalMachinesAssigned").default(0).notNull(), // All-time assigned machines
  lastWorkDate: timestamp("lastWorkDate"),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type EmployeePerformance = typeof employeePerformance.$inferSelect;
export type InsertEmployeePerformance = typeof employeePerformance.$inferInsert;
