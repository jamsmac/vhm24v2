import { eq, and, desc, sql, isNull, gte, lte, asc, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  InsertProduct, products, Product,
  InsertMachine, machines, Machine,
  InsertFavorite, favorites,
  InsertCartItem, cartItems,
  InsertOrder, orders, Order,
  InsertPromoCode, promoCodes, PromoCode,
  InsertNotification, notifications,
  InsertMachineInventory, machineInventory,
  InsertMaintenanceLog, maintenanceLogs,
  InsertGamificationTask, gamificationTasks, GamificationTask,
  InsertUserTaskCompletion, userTaskCompletions, UserTaskCompletion,
  InsertPointsTransaction, pointsTransactions,
  InsertUserPreferences, userPreferences, UserPreferences,
  InsertReferral, referrals, Referral,
  InsertReferralCode, referralCodes, ReferralCode,
  InsertReward, rewards, Reward,
  InsertUserReward, userRewards, UserReward
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER QUERIES ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPoints(userId: number, pointsDelta: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ pointsBalance: sql`${users.pointsBalance} + ${pointsDelta}` })
    .where(eq(users.id, userId));
}

export async function updateUserStats(userId: number, orderTotal: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ 
      totalSpent: sql`${users.totalSpent} + ${orderTotal}`,
      totalOrders: sql`${users.totalOrders} + 1`
    })
    .where(eq(users.id, userId));
}

export async function updateUserEmail(userId: number, email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ email, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// ==================== PRODUCT QUERIES ====================

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(eq(products.isAvailable, true));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPopularProducts(limit: number = 10): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products)
    .where(and(eq(products.isAvailable, true), eq(products.isPopular, true)))
    .limit(limit);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products)
    .where(and(eq(products.isAvailable, true), eq(products.category, category as any)));
}

export async function createProduct(product: InsertProduct): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(products).values(product);
}

// ==================== MACHINE QUERIES ====================

export async function getAllMachines(): Promise<Machine[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(machines);
}

export async function getMachineByCode(code: string): Promise<Machine | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(machines).where(eq(machines.machineCode, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMachineById(id: number): Promise<Machine | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(machines).where(eq(machines.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMachine(machine: InsertMachine): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(machines).values(machine);
  return result[0]?.insertId || 0;
}

// ==================== FAVORITES QUERIES ====================

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: favorites.id,
    productId: favorites.productId,
    createdAt: favorites.createdAt,
    product: products
  })
  .from(favorites)
  .innerJoin(products, eq(favorites.productId, products.id))
  .where(eq(favorites.userId, userId));
  
  return result;
}

export async function addFavorite(userId: number, productId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if already exists
  const existing = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
    .limit(1);
  
  if (existing.length === 0) {
    await db.insert(favorites).values({ userId, productId });
  }
}

export async function removeFavorite(userId: number, productId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
}

export async function isFavorite(userId: number, productId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
    .limit(1);
  return result.length > 0;
}

// ==================== CART QUERIES ====================

export async function getUserCart(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: cartItems.id,
    productId: cartItems.productId,
    quantity: cartItems.quantity,
    machineId: cartItems.machineId,
    customizations: cartItems.customizations,
    product: products
  })
  .from(cartItems)
  .innerJoin(products, eq(cartItems.productId, products.id))
  .where(eq(cartItems.userId, userId));
  
  return result;
}

export async function addToCart(item: InsertCartItem): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if item already exists in cart
  const existing = await db.select().from(cartItems)
    .where(and(
      eq(cartItems.userId, item.userId),
      eq(cartItems.productId, item.productId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update quantity
    await db.update(cartItems)
      .set({ quantity: sql`${cartItems.quantity} + ${item.quantity || 1}` })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values(item);
  }
}

export async function updateCartItemQuantity(id: number, quantity: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
  }
}

export async function removeFromCart(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.id, id));
}

export async function clearUserCart(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ==================== ORDER QUERIES ====================

export async function createOrder(order: InsertOrder): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.insert(orders).values(order);
  return Number(result[0].insertId);
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserOrders(userId: number, limit: number = 20): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function updateOrderStatus(id: number, status: Order['status']): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Partial<Order> = { status };
  if (status === 'completed') {
    updateData.completedAt = new Date();
  }
  
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

export async function updateOrderPaymentStatus(id: number, paymentStatus: Order['paymentStatus'], chargeId?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Partial<Order> = { paymentStatus };
  if (chargeId) {
    updateData.telegramPaymentChargeId = chargeId;
  }
  
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

// ==================== PROMO CODE QUERIES ====================

export async function getPromoCode(code: string): Promise<PromoCode | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promoCodes)
    .where(and(eq(promoCodes.code, code.toUpperCase()), eq(promoCodes.isActive, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementPromoCodeUsage(code: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(promoCodes)
    .set({ currentUses: sql`${promoCodes.currentUses} + 1` })
    .where(eq(promoCodes.code, code.toUpperCase()));
}

export async function createPromoCode(promo: InsertPromoCode): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(promoCodes).values({ ...promo, code: promo.code.toUpperCase() });
}

// ==================== NOTIFICATION QUERIES ====================

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function createNotification(notification: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(notification);
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count || 0;
}

// ==================== SEED DATA ====================

export async function seedInitialData(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if products already exist
  const existingProducts = await db.select().from(products).limit(1);
  if (existingProducts.length > 0) return;
  
  // Seed products
  const coffeeProducts: InsertProduct[] = [
    { slug: 'espresso', name: 'Espresso', nameRu: 'Эспрессо', category: 'coffee', price: 12000, isPopular: true, calories: 5, volume: 30, imageUrl: '/images/espresso-card.png' },
    { slug: 'americano', name: 'Americano', nameRu: 'Американо', category: 'coffee', price: 15000, isPopular: true, calories: 10, volume: 200, imageUrl: '/images/americano-card.png' },
    { slug: 'cappuccino', name: 'Cappuccino', nameRu: 'Капучино', category: 'coffee', price: 20000, isPopular: true, calories: 120, volume: 250, imageUrl: '/images/cappuccino-card.png' },
    { slug: 'latte', name: 'Latte', nameRu: 'Латте', category: 'coffee', price: 22000, isPopular: true, calories: 150, volume: 300, imageUrl: '/images/cappuccino-card.png' },
    { slug: 'mocha', name: 'Mocha', nameRu: 'Мокка', category: 'coffee', price: 25000, isPopular: false, calories: 200, volume: 300, imageUrl: '/images/cappuccino-card.png' },
    { slug: 'green-tea', name: 'Green Tea', nameRu: 'Чай зелёный', category: 'tea', price: 10000, isPopular: true, calories: 0, volume: 250, imageUrl: '/images/tea-card.png' },
    { slug: 'black-tea', name: 'Black Tea', nameRu: 'Чай чёрный', category: 'tea', price: 10000, isPopular: false, calories: 0, volume: 250, imageUrl: '/images/tea-card.png' },
    { slug: 'hot-chocolate', name: 'Hot Chocolate', nameRu: 'Горячий шоколад', category: 'other', price: 18000, isPopular: false, calories: 250, volume: 250, imageUrl: '/images/cappuccino-card.png' },
  ];
  
  await db.insert(products).values(coffeeProducts);
  
  // Seed machines
  const machineData: InsertMachine[] = [
    { machineCode: 'M-001', name: 'KIUT Корпус А', address: 'ул. Лабзак, 12', status: 'online' },
    { machineCode: 'M-002', name: 'KIUT Корпус Б', address: 'ул. Лабзак, 12', status: 'online' },
    { machineCode: 'M-003', name: 'Технопарк', address: 'ул. Мирзо Улугбека, 5', status: 'online' },
    { machineCode: 'M-004', name: 'IT Park', address: 'ул. Амира Темура, 108', status: 'maintenance' },
  ];
  
  await db.insert(machines).values(machineData);
  
  // Seed promo codes
  const promoData: InsertPromoCode[] = [
    { code: 'COFFEE10', discountPercent: 10, maxUses: 1000, minOrderAmount: 15000 },
    { code: 'WELCOME', discountPercent: 15, maxUses: 500, minOrderAmount: 20000 },
    { code: 'VIP20', discountPercent: 20, maxUses: 100, minOrderAmount: 30000 },
  ];
  
  await db.insert(promoCodes).values(promoData);
  
  console.log('[Database] Initial data seeded successfully');
}


// ==================== ADMIN QUERIES ====================

export async function updateProduct(id: number, data: Partial<InsertProduct>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id));
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(products).where(eq(products.id, id));
}

export async function getAllOrders(limit: number = 50, status?: Order['status']): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return await db.select().from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }
  
  return await db.select().from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
}

export async function updatePromoCode(id: number, data: Partial<InsertPromoCode & { isActive?: boolean }>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  if (data.code) {
    data.code = data.code.toUpperCase();
  }
  await db.update(promoCodes).set(data).where(eq(promoCodes.id, id));
}

export async function deletePromoCode(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(promoCodes).where(eq(promoCodes.id, id));
}

export async function updateMachineStatus(id: number, status: Machine['status']): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(machines).set({ status, updatedAt: new Date() }).where(eq(machines.id, id));
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    activePromoCodes: 0,
  };
  
  // Get total revenue
  const revenueResult = await db.select({ 
    total: sql<number>`COALESCE(SUM(${orders.total}), 0)` 
  }).from(orders).where(eq(orders.paymentStatus, 'paid'));
  
  // Get total orders
  const ordersResult = await db.select({ 
    count: sql<number>`COUNT(*)` 
  }).from(orders);
  
  // Get pending orders
  const pendingResult = await db.select({ 
    count: sql<number>`COUNT(*)` 
  }).from(orders).where(eq(orders.status, 'pending'));
  
  // Get total products
  const productsResult = await db.select({ 
    count: sql<number>`COUNT(*)` 
  }).from(products);
  
  // Get total users
  const usersResult = await db.select({ 
    count: sql<number>`COUNT(*)` 
  }).from(users);
  
  // Get active promo codes
  const promoResult = await db.select({ 
    count: sql<number>`COUNT(*)` 
  }).from(promoCodes).where(eq(promoCodes.isActive, true));
  
  return {
    totalRevenue: revenueResult[0]?.total || 0,
    totalOrders: ordersResult[0]?.count || 0,
    pendingOrders: pendingResult[0]?.count || 0,
    totalProducts: productsResult[0]?.count || 0,
    totalUsers: usersResult[0]?.count || 0,
    activePromoCodes: promoResult[0]?.count || 0,
  };
}


// ==================== MACHINE MANAGEMENT ====================

export async function updateMachine(id: number, data: Partial<InsertMachine>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(machines).set({ ...data, updatedAt: new Date() }).where(eq(machines.id, id));
}

export async function deleteMachine(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Delete related inventory and maintenance logs first
  await db.delete(machineInventory).where(eq(machineInventory.machineId, id));
  await db.delete(maintenanceLogs).where(eq(maintenanceLogs.machineId, id));
  await db.delete(machines).where(eq(machines.id, id));
}

// ==================== MACHINE INVENTORY ====================

export async function getMachineInventory(machineId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const inventory = await db.select({
    id: machineInventory.id,
    machineId: machineInventory.machineId,
    productId: machineInventory.productId,
    currentStock: machineInventory.currentStock,
    maxCapacity: machineInventory.maxCapacity,
    lowStockThreshold: machineInventory.lowStockThreshold,
    lastRestocked: machineInventory.lastRestocked,
    productName: products.nameRu,
  })
  .from(machineInventory)
  .leftJoin(products, eq(machineInventory.productId, products.id))
  .where(eq(machineInventory.machineId, machineId))
  .orderBy(products.name);
  
  return inventory;
}

export async function updateMachineInventory(machineId: number, productId: number, currentStock: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if inventory record exists
  const existing = await db.select().from(machineInventory)
    .where(and(
      eq(machineInventory.machineId, machineId),
      eq(machineInventory.productId, productId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing record
    await db.update(machineInventory)
      .set({ 
        currentStock, 
        lastRestocked: new Date(),
        updatedAt: new Date() 
      })
      .where(and(
        eq(machineInventory.machineId, machineId),
        eq(machineInventory.productId, productId)
      ));
  } else {
    // Create new record
    await db.insert(machineInventory).values({
      machineId,
      productId,
      currentStock,
      lastRestocked: new Date(),
    });
  }
}

export async function initializeMachineInventory(machineId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Get all products
  const allProducts = await db.select().from(products);
  
  // Create inventory records for each product
  for (const product of allProducts) {
    const existing = await db.select().from(machineInventory)
      .where(and(
        eq(machineInventory.machineId, machineId),
        eq(machineInventory.productId, product.id)
      ))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(machineInventory).values({
        machineId,
        productId: product.id,
        currentStock: 50, // Default initial stock
        maxCapacity: 100,
        lowStockThreshold: 10,
      });
    }
  }
}

// ==================== MAINTENANCE LOGS ====================

export async function getMachineMaintenanceLogs(machineId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(maintenanceLogs)
    .where(eq(maintenanceLogs.machineId, machineId))
    .orderBy(desc(maintenanceLogs.createdAt))
    .limit(50);
}

export async function addMaintenanceLog(data: InsertMaintenanceLog): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(maintenanceLogs).values(data);
  return result[0]?.insertId || 0;
}


// ==================== GAMIFICATION - TASKS ====================

export async function getAllTasks(includeInactive = false): Promise<GamificationTask[]> {
  const db = await getDb();
  if (!db) return [];
  
  const query = db.select().from(gamificationTasks);
  
  if (!includeInactive) {
    return await query
      .where(eq(gamificationTasks.isActive, true))
      .orderBy(gamificationTasks.sortOrder);
  }
  
  return await query.orderBy(gamificationTasks.sortOrder);
}

export async function getTaskById(id: number): Promise<GamificationTask | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(gamificationTasks)
    .where(eq(gamificationTasks.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getTaskBySlug(slug: string): Promise<GamificationTask | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(gamificationTasks)
    .where(eq(gamificationTasks.slug, slug))
    .limit(1);
  
  return result[0] || null;
}

export async function createTask(data: InsertGamificationTask): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.insert(gamificationTasks).values(data);
  return result[0]?.insertId || 0;
}

export async function updateTask(id: number, data: Partial<InsertGamificationTask>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(gamificationTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(gamificationTasks.id, id));
}

export async function deleteTask(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Delete related completions first
  await db.delete(userTaskCompletions).where(eq(userTaskCompletions.taskId, id));
  await db.delete(gamificationTasks).where(eq(gamificationTasks.id, id));
}

// ==================== GAMIFICATION - USER TASK PROGRESS ====================

export async function getUserTasksWithProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all active tasks with user's progress
  const tasks = await db.select({
    task: gamificationTasks,
    completion: userTaskCompletions,
  })
  .from(gamificationTasks)
  .leftJoin(
    userTaskCompletions, 
    and(
      eq(userTaskCompletions.taskId, gamificationTasks.id),
      eq(userTaskCompletions.userId, userId)
    )
  )
  .where(eq(gamificationTasks.isActive, true))
  .orderBy(gamificationTasks.sortOrder);
  
  return tasks.map(({ task, completion }) => ({
    ...task,
    currentProgress: completion?.currentProgress || 0,
    isCompleted: completion?.isCompleted || false,
    completionCount: completion?.completionCount || 0,
    pointsAwarded: completion?.pointsAwarded || 0,
    completedAt: completion?.completedAt,
  }));
}

export async function getUserTaskCompletion(userId: number, taskId: number): Promise<UserTaskCompletion | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userTaskCompletions)
    .where(and(
      eq(userTaskCompletions.userId, userId),
      eq(userTaskCompletions.taskId, taskId)
    ))
    .limit(1);
  
  return result[0] || null;
}

export async function upsertUserTaskProgress(
  userId: number, 
  taskId: number, 
  progress: number, 
  isCompleted: boolean = false,
  pointsAwarded: number = 0
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getUserTaskCompletion(userId, taskId);
  
  if (existing) {
    const updateData: Partial<InsertUserTaskCompletion> = {
      currentProgress: progress,
      lastProgressAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (isCompleted && !existing.isCompleted) {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
      updateData.completionCount = existing.completionCount + 1;
      updateData.pointsAwarded = existing.pointsAwarded + pointsAwarded;
    }
    
    await db.update(userTaskCompletions)
      .set(updateData)
      .where(eq(userTaskCompletions.id, existing.id));
  } else {
    await db.insert(userTaskCompletions).values({
      userId,
      taskId,
      currentProgress: progress,
      isCompleted,
      completionCount: isCompleted ? 1 : 0,
      pointsAwarded,
      completedAt: isCompleted ? new Date() : null,
      lastProgressAt: new Date(),
    });
  }
}

// ==================== GAMIFICATION - POINTS ====================

export async function getUserPointsBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ pointsBalance: users.pointsBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return result[0]?.pointsBalance || 0;
}

export async function addPointsTransaction(
  userId: number,
  amount: number,
  type: 'task_completion' | 'order_reward' | 'referral_bonus' | 'admin_adjustment' | 'redemption' | 'expiration',
  description?: string,
  referenceType?: string,
  referenceId?: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  // Get current balance
  const currentBalance = await getUserPointsBalance(userId);
  const newBalance = currentBalance + amount;
  
  // Update user's points balance
  await db.update(users)
    .set({ pointsBalance: newBalance, updatedAt: new Date() })
    .where(eq(users.id, userId));
  
  // Record the transaction
  const result = await db.insert(pointsTransactions).values({
    userId,
    amount,
    type,
    referenceType,
    referenceId,
    balanceAfter: newBalance,
    description,
  });
  
  return result[0]?.insertId || 0;
}

export async function getUserPointsHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(pointsTransactions)
    .where(eq(pointsTransactions.userId, userId))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(limit);
}

// ==================== GAMIFICATION - COMPLETE TASK ====================

export async function completeTask(userId: number, taskSlug: string): Promise<{
  success: boolean;
  pointsAwarded: number;
  message: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, pointsAwarded: 0, message: 'Database not available' };
  
  // Get the task
  const task = await getTaskBySlug(taskSlug);
  if (!task) {
    return { success: false, pointsAwarded: 0, message: 'Task not found' };
  }
  
  if (!task.isActive) {
    return { success: false, pointsAwarded: 0, message: 'Task is not active' };
  }
  
  // Check if already completed (for non-repeatable tasks)
  const existing = await getUserTaskCompletion(userId, task.id);
  if (existing?.isCompleted && !task.isRepeatable) {
    return { success: false, pointsAwarded: 0, message: 'Task already completed' };
  }
  
  // Check max completions
  if (task.maxCompletions && existing && existing.completionCount >= task.maxCompletions) {
    return { success: false, pointsAwarded: 0, message: 'Maximum completions reached' };
  }
  
  // Check cooldown for repeatable tasks
  if (task.isRepeatable && task.repeatCooldownHours && existing?.completedAt) {
    const cooldownMs = task.repeatCooldownHours * 60 * 60 * 1000;
    const timeSinceCompletion = Date.now() - new Date(existing.completedAt).getTime();
    if (timeSinceCompletion < cooldownMs) {
      const hoursRemaining = Math.ceil((cooldownMs - timeSinceCompletion) / (60 * 60 * 1000));
      return { success: false, pointsAwarded: 0, message: `Please wait ${hoursRemaining} hours before completing again` };
    }
  }
  
  // Award points
  const pointsAwarded = task.pointsReward;
  await addPointsTransaction(
    userId,
    pointsAwarded,
    'task_completion',
    `Completed task: ${task.titleRu || task.title}`,
    'task',
    task.id
  );
  
  // Update task completion
  await upsertUserTaskProgress(userId, task.id, task.requiredValue || 1, true, pointsAwarded);
  
  return { 
    success: true, 
    pointsAwarded, 
    message: `Task completed! +${pointsAwarded} points` 
  };
}

// ==================== USER PREFERENCES ====================

export async function getUserPreferences(userId: number): Promise<UserPreferences | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  
  return result[0] || null;
}

export async function upsertUserPreferences(userId: number, data: Partial<InsertUserPreferences>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getUserPreferences(userId);
  
  if (existing) {
    await db.update(userPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      userId,
      ...data,
    });
  }
}

// ==================== SEED DEFAULT TASKS ====================

export async function seedDefaultTasks(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const defaultTasks: InsertGamificationTask[] = [
    {
      slug: 'link_telegram',
      title: 'Link Telegram Account',
      titleRu: 'Привязать Telegram',
      description: 'Connect your Telegram account to earn points',
      descriptionRu: 'Привяжите аккаунт Telegram для получения баллов',
      taskType: 'link_telegram',
      pointsReward: 100,
      requiredValue: 1,
      isRepeatable: false,
      iconName: 'MessageCircle',
      sortOrder: 1,
      isActive: true,
    },
    {
      slug: 'link_email',
      title: 'Add Email Address',
      titleRu: 'Добавить Email',
      description: 'Add your email address to earn points',
      descriptionRu: 'Добавьте email для получения баллов',
      taskType: 'link_email',
      pointsReward: 50,
      requiredValue: 1,
      isRepeatable: false,
      iconName: 'Mail',
      sortOrder: 2,
      isActive: true,
    },
    {
      slug: 'first_order',
      title: 'First Order',
      titleRu: 'Первый заказ',
      description: 'Complete your first order',
      descriptionRu: 'Сделайте первый заказ',
      taskType: 'first_order',
      pointsReward: 200,
      requiredValue: 1,
      isRepeatable: false,
      iconName: 'ShoppingBag',
      sortOrder: 3,
      isActive: true,
    },
    {
      slug: 'order_5',
      title: 'Regular Customer',
      titleRu: 'Постоянный клиент',
      description: 'Complete 5 orders',
      descriptionRu: 'Сделайте 5 заказов',
      taskType: 'order_count',
      pointsReward: 300,
      requiredValue: 5,
      isRepeatable: false,
      iconName: 'Award',
      sortOrder: 4,
      isActive: true,
    },
    {
      slug: 'daily_login',
      title: 'Daily Visit',
      titleRu: 'Ежедневный визит',
      description: 'Visit the app daily',
      descriptionRu: 'Заходите в приложение каждый день',
      taskType: 'daily_login',
      pointsReward: 10,
      requiredValue: 1,
      isRepeatable: true,
      repeatCooldownHours: 24,
      iconName: 'Calendar',
      sortOrder: 5,
      isActive: true,
    },
  ];
  
  for (const task of defaultTasks) {
    const existing = await getTaskBySlug(task.slug);
    if (!existing) {
      await createTask(task);
    }
  }
}


// ==================== REFERRAL QUERIES ====================

// Generate a unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get or create referral code for a user
export async function getOrCreateReferralCode(userId: number): Promise<ReferralCode | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Check if user already has a code
  const existing = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Generate a unique code
  let code = generateReferralCode();
  let attempts = 0;
  while (attempts < 10) {
    const codeExists = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code))
      .limit(1);
    
    if (codeExists.length === 0) break;
    code = generateReferralCode();
    attempts++;
  }
  
  // Create the referral code
  await db.insert(referralCodes).values({
    userId,
    code,
  });
  
  // Return the created code
  const created = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);
  
  return created[0] || null;
}

// Get referral code by code string
export async function getReferralCodeByCode(code: string): Promise<ReferralCode | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.code, code.toUpperCase()))
    .limit(1);
  
  return result[0] || null;
}

// Get referral statistics for a user
export async function getReferralStats(userId: number): Promise<{
  code: string;
  totalClicks: number;
  totalReferrals: number;
  totalPointsEarned: number;
  pendingReferrals: number;
  completedReferrals: number;
} | null> {
  const db = await getDb();
  if (!db) return null;
  
  const codeData = await getOrCreateReferralCode(userId);
  if (!codeData) return null;
  
  // Count pending and completed referrals
  const referralsList = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId));
  
  const pendingReferrals = referralsList.filter(r => r.status === 'pending' || r.status === 'registered').length;
  const completedReferrals = referralsList.filter(r => r.status === 'completed').length;
  
  return {
    code: codeData.code,
    totalClicks: codeData.totalClicks,
    totalReferrals: codeData.totalReferrals,
    totalPointsEarned: codeData.totalPointsEarned,
    pendingReferrals,
    completedReferrals,
  };
}

// Track a referral click
export async function trackReferralClick(code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const codeData = await getReferralCodeByCode(code);
  if (!codeData || !codeData.isActive) return false;
  
  // Increment click count
  await db
    .update(referralCodes)
    .set({ 
      totalClicks: sql`${referralCodes.totalClicks} + 1`,
      updatedAt: new Date()
    })
    .where(eq(referralCodes.id, codeData.id));
  
  return true;
}

// Create a referral when a new user registers with a referral code
export async function createReferral(referrerCode: string, referredUserId: number): Promise<Referral | null> {
  const db = await getDb();
  if (!db) return null;
  
  const codeData = await getReferralCodeByCode(referrerCode);
  if (!codeData || !codeData.isActive) return null;
  
  // Check if user was already referred
  const existingReferral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredUserId, referredUserId))
    .limit(1);
  
  if (existingReferral.length > 0) return null;
  
  // Can't refer yourself
  if (codeData.userId === referredUserId) return null;
  
  // Create the referral
  await db.insert(referrals).values({
    referrerId: codeData.userId,
    referrerCode: codeData.code,
    referredUserId,
    status: 'registered',
  });
  
  // Get the created referral
  const created = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredUserId, referredUserId))
    .limit(1);
  
  return created[0] || null;
}

// Complete a referral and award points
export async function completeReferral(
  referredUserId: number, 
  referrerPoints: number = 200, 
  referredPoints: number = 100
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Find the referral
  const referral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredUserId, referredUserId))
    .limit(1);
  
  if (referral.length === 0 || referral[0].status === 'completed') return false;
  
  const ref = referral[0];
  
  // Update referral status
  await db
    .update(referrals)
    .set({
      status: 'completed',
      referrerPointsAwarded: referrerPoints,
      referredPointsAwarded: referredPoints,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(referrals.id, ref.id));
  
  // Award points to referrer
  await db
    .update(users)
    .set({ 
      pointsBalance: sql`${users.pointsBalance} + ${referrerPoints}`,
      updatedAt: new Date()
    })
    .where(eq(users.id, ref.referrerId));
  
  // Get referrer's new balance for transaction log
  const referrer = await db
    .select()
    .from(users)
    .where(eq(users.id, ref.referrerId))
    .limit(1);
  
  if (referrer.length > 0) {
    await db.insert(pointsTransactions).values({
      userId: ref.referrerId,
      amount: referrerPoints,
      type: 'referral_bonus',
      referenceType: 'referral',
      referenceId: ref.id,
      balanceAfter: referrer[0].pointsBalance,
      description: `Бонус за приглашение друга`,
    });
  }
  
  // Award points to referred user
  await db
    .update(users)
    .set({ 
      pointsBalance: sql`${users.pointsBalance} + ${referredPoints}`,
      updatedAt: new Date()
    })
    .where(eq(users.id, referredUserId));
  
  // Get referred user's new balance for transaction log
  const referred = await db
    .select()
    .from(users)
    .where(eq(users.id, referredUserId))
    .limit(1);
  
  if (referred.length > 0) {
    await db.insert(pointsTransactions).values({
      userId: referredUserId,
      amount: referredPoints,
      type: 'referral_bonus',
      referenceType: 'referral',
      referenceId: ref.id,
      balanceAfter: referred[0].pointsBalance,
      description: `Бонус за регистрацию по приглашению`,
    });
  }
  
  // Update referral code statistics
  await db
    .update(referralCodes)
    .set({
      totalReferrals: sql`${referralCodes.totalReferrals} + 1`,
      totalPointsEarned: sql`${referralCodes.totalPointsEarned} + ${referrerPoints}`,
      updatedAt: new Date(),
    })
    .where(eq(referralCodes.code, ref.referrerCode));
  
  return true;
}

// Get list of referrals for a user
export async function getUserReferrals(userId: number): Promise<Array<{
  id: number;
  referredUserId: number | null;
  referredUserName: string | null;
  status: string;
  pointsAwarded: number;
  createdAt: Date;
  completedAt: Date | null;
}>> {
  const db = await getDb();
  if (!db) return [];
  
  const referralsList = await db
    .select({
      id: referrals.id,
      referredUserId: referrals.referredUserId,
      status: referrals.status,
      pointsAwarded: referrals.referrerPointsAwarded,
      createdAt: referrals.createdAt,
      completedAt: referrals.completedAt,
    })
    .from(referrals)
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));
  
  // Get user names for referred users
  const result = await Promise.all(
    referralsList.map(async (ref) => {
      let referredUserName: string | null = null;
      if (ref.referredUserId) {
        const user = await db
          .select({ name: users.name, telegramFirstName: users.telegramFirstName })
          .from(users)
          .where(eq(users.id, ref.referredUserId))
          .limit(1);
        if (user.length > 0) {
          referredUserName = user[0].name || user[0].telegramFirstName || 'Пользователь';
        }
      }
      return {
        ...ref,
        referredUserName,
      };
    })
  );
  
  return result;
}

// Check if user was referred and get referrer info
export async function getUserReferrer(userId: number): Promise<{
  referrerId: number;
  referrerName: string | null;
  bonusReceived: number;
} | null> {
  const db = await getDb();
  if (!db) return null;
  
  const referral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredUserId, userId))
    .limit(1);
  
  if (referral.length === 0) return null;
  
  const ref = referral[0];
  
  // Get referrer name
  const referrer = await db
    .select({ name: users.name, telegramFirstName: users.telegramFirstName })
    .from(users)
    .where(eq(users.id, ref.referrerId))
    .limit(1);
  
  return {
    referrerId: ref.referrerId,
    referrerName: referrer[0]?.name || referrer[0]?.telegramFirstName || null,
    bonusReceived: ref.referredPointsAwarded,
  };
}


// ==================== REWARDS STORE QUERIES ====================

// Generate a unique redemption code
function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get all active rewards
export async function getActiveRewards(): Promise<Reward[]> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  const result = await db
    .select()
    .from(rewards)
    .where(
      and(
        eq(rewards.isActive, true),
        or(isNull(rewards.startsAt), lte(rewards.startsAt, now)),
        or(isNull(rewards.expiresAt), gte(rewards.expiresAt, now))
      )
    )
    .orderBy(asc(rewards.sortOrder), desc(rewards.isFeatured));
  
  return result;
}

// Get reward by ID
export async function getRewardById(id: number): Promise<Reward | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(rewards)
    .where(eq(rewards.id, id))
    .limit(1);
  
  return result[0] || null;
}

// Get reward by slug
export async function getRewardBySlug(slug: string): Promise<Reward | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(rewards)
    .where(eq(rewards.slug, slug))
    .limit(1);
  
  return result[0] || null;
}

// Create a new reward (admin)
export async function createReward(data: InsertReward): Promise<Reward | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.insert(rewards).values(data);
  
  return await getRewardBySlug(data.slug);
}

// Update a reward (admin)
export async function updateReward(id: number, data: Partial<InsertReward>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db
    .update(rewards)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(rewards.id, id));
  
  return true;
}

// Delete a reward (admin)
export async function deleteReward(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(rewards).where(eq(rewards.id, id));
  return true;
}

// Get all rewards (admin)
export async function getAllRewards(): Promise<Reward[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(rewards)
    .orderBy(asc(rewards.sortOrder));
}

// Purchase a reward
export async function purchaseReward(userId: number, rewardId: number): Promise<{
  success: boolean;
  error?: string;
  userReward?: UserReward;
}> {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database not available' };
  
  // Get the reward
  const reward = await getRewardById(rewardId);
  if (!reward) {
    return { success: false, error: 'Reward not found' };
  }
  
  // Check if reward is active
  if (!reward.isActive) {
    return { success: false, error: 'Reward is not available' };
  }
  
  // Check time limits
  const now = new Date();
  if (reward.startsAt && reward.startsAt > now) {
    return { success: false, error: 'Reward not yet available' };
  }
  if (reward.expiresAt && reward.expiresAt < now) {
    return { success: false, error: 'Reward has expired' };
  }
  
  // Check stock
  if (reward.stockLimit !== null && (reward.stockRemaining === null || reward.stockRemaining <= 0)) {
    return { success: false, error: 'Reward out of stock' };
  }
  
  // Check user's purchase count for this reward
  if (reward.maxPerUser) {
    const userPurchases = await db
      .select({ count: sql<number>`count(*)` })
      .from(userRewards)
      .where(
        and(
          eq(userRewards.userId, userId),
          eq(userRewards.rewardId, rewardId)
        )
      );
    
    if (userPurchases[0]?.count >= reward.maxPerUser) {
      return { success: false, error: 'Maximum purchase limit reached' };
    }
  }
  
  // Get user's points balance
  const user = await db
    .select({ pointsBalance: users.pointsBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user[0] || user[0].pointsBalance < reward.pointsCost) {
    return { success: false, error: 'Insufficient points' };
  }
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (reward.validityDays || 30));
  
  // Generate unique redemption code
  let redemptionCode = generateRedemptionCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db
      .select()
      .from(userRewards)
      .where(eq(userRewards.redemptionCode, redemptionCode))
      .limit(1);
    
    if (existing.length === 0) break;
    redemptionCode = generateRedemptionCode();
    attempts++;
  }
  
  // Deduct points from user
  const newBalance = user[0].pointsBalance - reward.pointsCost;
  await db
    .update(users)
    .set({ 
      pointsBalance: newBalance,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
  
  // Record points transaction
  await db.insert(pointsTransactions).values({
    userId,
    amount: -reward.pointsCost,
    type: 'redemption',
    referenceType: 'reward',
    referenceId: rewardId,
    balanceAfter: newBalance,
    description: `Покупка награды: ${reward.nameRu || reward.name}`,
  });
  
  // Create user reward
  await db.insert(userRewards).values({
    userId,
    rewardId,
    pointsSpent: reward.pointsCost,
    expiresAt,
    redemptionCode,
  });
  
  // Update stock if limited
  if (reward.stockLimit !== null && reward.stockRemaining !== null) {
    await db
      .update(rewards)
      .set({ 
        stockRemaining: reward.stockRemaining - 1,
        updatedAt: new Date()
      })
      .where(eq(rewards.id, rewardId));
  }
  
  // Get the created user reward
  const created = await db
    .select()
    .from(userRewards)
    .where(eq(userRewards.redemptionCode, redemptionCode))
    .limit(1);
  
  return { success: true, userReward: created[0] };
}

// Get user's rewards
export async function getUserRewards(userId: number, status?: 'active' | 'redeemed' | 'expired'): Promise<Array<UserReward & { reward: Reward }>> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db
    .select({
      userReward: userRewards,
      reward: rewards,
    })
    .from(userRewards)
    .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
    .where(eq(userRewards.userId, userId));
  
  const results = await query.orderBy(desc(userRewards.purchasedAt));
  
  // Filter by status if provided
  let filtered = results;
  if (status) {
    filtered = results.filter(r => r.userReward.status === status);
  }
  
  // Check for expired rewards and update status
  const now = new Date();
  for (const result of filtered) {
    if (result.userReward.status === 'active' && result.userReward.expiresAt < now) {
      await db
        .update(userRewards)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(userRewards.id, result.userReward.id));
      result.userReward.status = 'expired';
    }
  }
  
  return filtered.map(r => ({
    ...r.userReward,
    reward: r.reward,
  }));
}

// Redeem a reward
export async function redeemReward(userId: number, userRewardId: number, orderId?: number): Promise<{
  success: boolean;
  error?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database not available' };
  
  // Get the user reward
  const userReward = await db
    .select()
    .from(userRewards)
    .where(
      and(
        eq(userRewards.id, userRewardId),
        eq(userRewards.userId, userId)
      )
    )
    .limit(1);
  
  if (!userReward[0]) {
    return { success: false, error: 'Reward not found' };
  }
  
  if (userReward[0].status !== 'active') {
    return { success: false, error: 'Reward is not active' };
  }
  
  // Check expiration
  if (userReward[0].expiresAt < new Date()) {
    await db
      .update(userRewards)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(userRewards.id, userRewardId));
    return { success: false, error: 'Reward has expired' };
  }
  
  // Mark as redeemed
  await db
    .update(userRewards)
    .set({
      status: 'redeemed',
      redeemedAt: new Date(),
      redeemedOrderId: orderId || null,
      updatedAt: new Date(),
    })
    .where(eq(userRewards.id, userRewardId));
  
  return { success: true };
}

// Get user reward by redemption code
export async function getUserRewardByCode(code: string): Promise<(UserReward & { reward: Reward }) | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      userReward: userRewards,
      reward: rewards,
    })
    .from(userRewards)
    .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
    .where(eq(userRewards.redemptionCode, code.toUpperCase()))
    .limit(1);
  
  if (!result[0]) return null;
  
  return {
    ...result[0].userReward,
    reward: result[0].reward,
  };
}

// Seed default rewards
export async function seedDefaultRewards(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const defaultRewards: InsertReward[] = [
    {
      slug: 'free_americano',
      name: 'Free Americano',
      nameRu: 'Бесплатный Американо',
      description: 'Get a free Americano coffee',
      descriptionRu: 'Получите бесплатный кофе Американо',
      rewardType: 'free_drink',
      pointsCost: 500,
      validityDays: 30,
      sortOrder: 1,
      isActive: true,
      isFeatured: true,
    },
    {
      slug: 'free_cappuccino',
      name: 'Free Cappuccino',
      nameRu: 'Бесплатный Капучино',
      description: 'Get a free Cappuccino',
      descriptionRu: 'Получите бесплатный Капучино',
      rewardType: 'free_drink',
      pointsCost: 600,
      validityDays: 30,
      sortOrder: 2,
      isActive: true,
      isFeatured: true,
    },
    {
      slug: 'discount_10',
      name: '10% Discount',
      nameRu: 'Скидка 10%',
      description: 'Get 10% off your next order',
      descriptionRu: 'Получите скидку 10% на следующий заказ',
      rewardType: 'discount_percent',
      pointsCost: 300,
      discountValue: 10,
      validityDays: 14,
      sortOrder: 3,
      isActive: true,
    },
    {
      slug: 'discount_20',
      name: '20% Discount',
      nameRu: 'Скидка 20%',
      description: 'Get 20% off your next order',
      descriptionRu: 'Получите скидку 20% на следующий заказ',
      rewardType: 'discount_percent',
      pointsCost: 500,
      discountValue: 20,
      validityDays: 14,
      sortOrder: 4,
      isActive: true,
    },
    {
      slug: 'discount_5000',
      name: '5000 UZS Off',
      nameRu: 'Скидка 5000 сум',
      description: 'Get 5000 UZS off your next order',
      descriptionRu: 'Получите скидку 5000 сум на следующий заказ',
      rewardType: 'discount_fixed',
      pointsCost: 200,
      discountValue: 5000,
      validityDays: 14,
      sortOrder: 5,
      isActive: true,
    },
    {
      slug: 'free_upgrade',
      name: 'Free Size Upgrade',
      nameRu: 'Бесплатное увеличение',
      description: 'Upgrade your drink size for free',
      descriptionRu: 'Увеличьте размер напитка бесплатно',
      rewardType: 'free_upgrade',
      pointsCost: 150,
      validityDays: 7,
      sortOrder: 6,
      isActive: true,
    },
  ];
  
  for (const reward of defaultRewards) {
    const existing = await getRewardBySlug(reward.slug);
    if (!existing) {
      await createReward(reward);
    }
  }
}
