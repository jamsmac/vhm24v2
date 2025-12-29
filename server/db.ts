import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, User,
  InsertProduct, products, Product,
  InsertMachine, machines, Machine,
  InsertFavorite, favorites,
  InsertCartItem, cartItems,
  InsertOrder, orders, Order,
  InsertPromoCode, promoCodes, PromoCode,
  InsertNotification, notifications,
  InsertPointsTransaction, pointsTransactions, PointsTransaction,
  InsertDailyQuest, dailyQuests, DailyQuest,
  InsertUserDailyQuestProgress, userDailyQuestProgress, UserDailyQuestProgress
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

// Welcome bonus amount (equivalent to espresso price)
export const WELCOME_BONUS_AMOUNT = 15000;

// First order bonus amount
export const FIRST_ORDER_BONUS_AMOUNT = 10000;

/**
 * Check if user is eligible for first order bonus
 * Returns true if this is the user's first completed order
 */
export async function isFirstOrder(userId: number): Promise<boolean> {
  const user = await getUserById(userId);
  // totalOrders is incremented BEFORE this check, so first order = 1
  return user?.totalOrders === 1;
}

/**
 * Grant first order bonus to user
 */
export async function grantFirstOrderBonus(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Grant bonus points
  await db.update(users)
    .set({ 
      pointsBalance: sql`${users.pointsBalance} + ${FIRST_ORDER_BONUS_AMOUNT}`
    })
    .where(eq(users.id, userId));
  
  return true;
}

export async function grantWelcomeBonus(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Check if user already received welcome bonus
  const user = await getUserById(userId);
  if (!user || user.welcomeBonusReceived) {
    return false;
  }
  
  // Grant welcome bonus
  await db.update(users)
    .set({ 
      pointsBalance: sql`${users.pointsBalance} + ${WELCOME_BONUS_AMOUNT}`,
      welcomeBonusReceived: true
    })
    .where(eq(users.id, userId));
  
  return true;
}

export async function hasReceivedWelcomeBonus(userId: number): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.welcomeBonusReceived ?? false;
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

export async function createMachine(machine: InsertMachine): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(machines).values(machine);
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


// ==================== ACHIEVEMENT NOTIFICATIONS ====================

export interface AchievementData {
  id: string;
  name: string;
  description: string;
  category: string;
}

export async function createAchievementNotification(
  userId: number, 
  achievement: AchievementData
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(notifications).values({
    userId,
    type: 'bonus',
    title: `🏆 Новое достижение!`,
    message: `Вы получили достижение "${achievement.name}"! ${achievement.description}`,
    data: { 
      type: 'achievement_unlock',
      achievementId: achievement.id,
      achievementName: achievement.name,
      category: achievement.category
    }
  });
}

export async function sendAchievementTelegramNotification(
  userId: number,
  achievement: AchievementData
): Promise<void> {
  const user = await getUserById(userId);
  if (!user?.telegramId) return;
  
  const { sendTelegramMessage } = await import('./telegramBot');
  await sendTelegramMessage(
    user.telegramId,
    `🏆 <b>Новое достижение!</b>\n\n` +
    `Вы получили достижение "<b>${achievement.name}</b>"!\n\n` +
    `${achievement.description}\n\n` +
    `Продолжайте в том же духе! ☕`
  );
}


// ==================== POINTS TRANSACTIONS ====================

export async function getPointsHistory(userId: number, limit: number = 50): Promise<PointsTransaction[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pointsTransactions)
    .where(eq(pointsTransactions.userId, userId))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(limit);
}

export async function createPointsTransaction(transaction: InsertPointsTransaction): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(pointsTransactions).values(transaction);
}

export async function recordPointsTransaction(
  userId: number,
  type: 'earn' | 'spend' | 'bonus' | 'refund' | 'expired',
  amount: number,
  description: string,
  source: 'order' | 'welcome_bonus' | 'first_order' | 'referral' | 'achievement' | 'daily_quest' | 'promo' | 'admin' | 'refund',
  referenceId?: string
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) return;
  
  const balanceAfter = user.pointsBalance + amount;
  
  await createPointsTransaction({
    userId,
    type,
    amount,
    balanceAfter,
    description,
    source,
    referenceId,
  });
}

// ==================== DAILY QUESTS ====================

export async function getAllDailyQuests(): Promise<DailyQuest[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(dailyQuests).where(eq(dailyQuests.isActive, true));
}

export async function getUserDailyQuestProgress(userId: number, questDate: Date): Promise<UserDailyQuestProgress[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get start and end of the day
  const startOfDay = new Date(questDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(questDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await db.select().from(userDailyQuestProgress)
    .where(and(
      eq(userDailyQuestProgress.userId, userId),
      sql`${userDailyQuestProgress.questDate} >= ${startOfDay}`,
      sql`${userDailyQuestProgress.questDate} <= ${endOfDay}`
    ));
}

export async function initializeDailyQuestProgress(userId: number, questId: number, questDate: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if progress already exists
  const existing = await db.select().from(userDailyQuestProgress)
    .where(and(
      eq(userDailyQuestProgress.userId, userId),
      eq(userDailyQuestProgress.questId, questId),
      sql`DATE(${userDailyQuestProgress.questDate}) = DATE(${questDate})`
    ))
    .limit(1);
  
  if (existing.length === 0) {
    await db.insert(userDailyQuestProgress).values({
      userId,
      questId,
      questDate,
      currentValue: 0,
      isCompleted: false,
      rewardClaimed: false,
    });
  }
}

export async function updateDailyQuestProgress(
  userId: number,
  questId: number,
  questDate: Date,
  currentValue: number,
  isCompleted: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(userDailyQuestProgress)
    .set({ 
      currentValue, 
      isCompleted,
      completedAt: isCompleted ? new Date() : null
    })
    .where(and(
      eq(userDailyQuestProgress.userId, userId),
      eq(userDailyQuestProgress.questId, questId),
      sql`DATE(${userDailyQuestProgress.questDate}) = DATE(${questDate})`
    ));
}

export async function claimDailyQuestReward(userId: number, questId: number, questDate: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Get progress
  const progress = await db.select().from(userDailyQuestProgress)
    .where(and(
      eq(userDailyQuestProgress.userId, userId),
      eq(userDailyQuestProgress.questId, questId),
      sql`DATE(${userDailyQuestProgress.questDate}) = DATE(${questDate})`
    ))
    .limit(1);
  
  if (progress.length === 0 || !progress[0].isCompleted || progress[0].rewardClaimed) {
    return false;
  }
  
  // Get quest reward
  const quest = await db.select().from(dailyQuests).where(eq(dailyQuests.id, questId)).limit(1);
  if (quest.length === 0) return false;
  
  const rewardPoints = quest[0].rewardPoints;
  
  // Update user points
  await db.update(users)
    .set({ pointsBalance: sql`${users.pointsBalance} + ${rewardPoints}` })
    .where(eq(users.id, userId));
  
  // Mark reward as claimed
  await db.update(userDailyQuestProgress)
    .set({ rewardClaimed: true })
    .where(and(
      eq(userDailyQuestProgress.userId, userId),
      eq(userDailyQuestProgress.questId, questId),
      sql`DATE(${userDailyQuestProgress.questDate}) = DATE(${questDate})`
    ));
  
  // Record transaction
  await recordPointsTransaction(
    userId,
    'bonus',
    rewardPoints,
    `Награда за задание: ${quest[0].title}`,
    'daily_quest',
    `quest_${questId}`
  );
  
  return true;
}

export async function seedDailyQuests(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if quests already exist
  const existing = await db.select().from(dailyQuests).limit(1);
  if (existing.length > 0) return;
  
  const quests: InsertDailyQuest[] = [
    // Daily quests
    {
      questKey: 'daily_order',
      title: 'Сделай заказ',
      description: 'Сделайте любой заказ сегодня',
      type: 'order',
      targetValue: 1,
      rewardPoints: 500,
      isWeekly: false,
    },
    {
      questKey: 'daily_spend_30k',
      title: 'Потратьте 30,000 UZS',
      description: 'Сделайте заказ на сумму от 30,000 UZS',
      type: 'spend',
      targetValue: 30000,
      rewardPoints: 1500,
      isWeekly: false,
    },
    {
      questKey: 'daily_visit',
      title: 'Посетите приложение',
      description: 'Откройте приложение и просмотрите меню',
      type: 'visit',
      targetValue: 1,
      rewardPoints: 100,
      isWeekly: false,
    },
    // Weekly quests (higher rewards)
    {
      questKey: 'weekly_orders_5',
      title: 'Кофеман недели',
      description: 'Сделайте 5 заказов за неделю',
      type: 'order',
      targetValue: 5,
      rewardPoints: 5000,
      isWeekly: true,
    },
    {
      questKey: 'weekly_spend_100k',
      title: 'Щедрая неделя',
      description: 'Потратьте 100,000 UZS за неделю',
      type: 'spend',
      targetValue: 100000,
      rewardPoints: 10000,
      isWeekly: true,
    },
    {
      questKey: 'weekly_streak_7',
      title: 'Серия 7 дней',
      description: 'Заходите в приложение 7 дней подряд',
      type: 'visit',
      targetValue: 7,
      rewardPoints: 7000,
      isWeekly: true,
    },
  ];
  
  await db.insert(dailyQuests).values(quests);
}

// ==================== LEADERBOARD ====================

export interface LeaderboardEntry {
  userId: number;
  name: string | null;
  telegramUsername: string | null;
  telegramPhotoUrl: string | null;
  totalOrders: number;
  totalSpent: number;
  pointsBalance: number;
  loyaltyLevel: string;
  achievementCount: number;
}

export async function getLeaderboard(limit: number = 20, period: 'week' | 'month' | 'all' = 'all'): Promise<LeaderboardEntry[]> {
  const db = await getDb();
  if (!db) return [];
  
  // For period filtering, we would need to aggregate orders by date
  // For now, we use the total stats but could be enhanced with period-specific queries
  let dateFilter = null;
  if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    dateFilter = weekAgo;
  } else if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    dateFilter = monthAgo;
  }
  
  // If period filter is set, we need to count orders from that period
  // For simplicity, we'll use total stats for now (in production, aggregate orders table)
  const result = await db.select({
    userId: users.id,
    name: users.name,
    telegramUsername: users.telegramUsername,
    telegramPhotoUrl: users.telegramPhotoUrl,
    totalOrders: users.totalOrders,
    totalSpent: users.totalSpent,
    pointsBalance: users.pointsBalance,
    loyaltyLevel: users.loyaltyLevel,
  })
    .from(users)
    .orderBy(desc(users.totalOrders), desc(users.totalSpent))
    .limit(limit);
  
  // Add achievement count (simplified - would need achievement tracking table in production)
  return result.map(user => ({
    ...user,
    achievementCount: calculateAchievementCount(user.totalOrders, user.totalSpent, user.pointsBalance, user.loyaltyLevel),
  }));
}

function calculateAchievementCount(totalOrders: number, totalSpent: number, pointsBalance: number, loyaltyLevel: string): number {
  let count = 1; // Early bird always unlocked
  
  // Order achievements
  if (totalOrders >= 1) count++;
  if (totalOrders >= 10) count++;
  if (totalOrders >= 25) count++;
  if (totalOrders >= 50) count++;
  if (totalOrders >= 100) count++;
  
  // Loyalty achievements
  if (['silver', 'gold', 'platinum'].includes(loyaltyLevel)) count++;
  if (['gold', 'platinum'].includes(loyaltyLevel)) count++;
  if (loyaltyLevel === 'platinum') count++;
  
  // Points achievements
  if (pointsBalance >= 50000) count++;
  if (pointsBalance >= 100000) count++;
  
  return count;
}


// ==================== DAILY QUESTS CRUD ====================

export async function createDailyQuest(quest: InsertDailyQuest): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(dailyQuests).values(quest);
}

export async function updateDailyQuest(id: number, data: Partial<InsertDailyQuest>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(dailyQuests).set(data).where(eq(dailyQuests.id, id));
}

export async function deleteDailyQuest(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(dailyQuests).where(eq(dailyQuests.id, id));
}


// ==================== STREAK TRACKING ====================

export async function updateUserStreak(userId: number): Promise<{ currentStreak: number; longestStreak: number; isNewDay: boolean }> {
  const db = await getDb();
  if (!db) return { currentStreak: 0, longestStreak: 0, isNewDay: false };
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) return { currentStreak: 0, longestStreak: 0, isNewDay: false };
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastCompleted = user[0].lastQuestCompletedDate;
  
  let currentStreak = user[0].currentStreak || 0;
  let longestStreak = user[0].longestStreak || 0;
  let isNewDay = false;
  
  if (!lastCompleted) {
    // First time completing a quest
    currentStreak = 1;
    isNewDay = true;
  } else {
    const lastDate = new Date(lastCompleted);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const daysDiff = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, no streak change
      isNewDay = false;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      currentStreak += 1;
      isNewDay = true;
    } else {
      // Streak broken, reset to 1
      currentStreak = 1;
      isNewDay = true;
    }
  }
  
  // Update longest streak if current is higher
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }
  
  // Update user record
  await db.update(users).set({
    currentStreak,
    longestStreak,
    lastQuestCompletedDate: now,
  }).where(eq(users.id, userId));
  
  return { currentStreak, longestStreak, isNewDay };
}

export async function getUserStreak(userId: number): Promise<{ currentStreak: number; longestStreak: number }> {
  const db = await getDb();
  if (!db) return { currentStreak: 0, longestStreak: 0 };
  
  const user = await db.select({
    currentStreak: users.currentStreak,
    longestStreak: users.longestStreak,
  }).from(users).where(eq(users.id, userId)).limit(1);
  
  if (user.length === 0) return { currentStreak: 0, longestStreak: 0 };
  
  return {
    currentStreak: user[0].currentStreak || 0,
    longestStreak: user[0].longestStreak || 0,
  };
}

// Get weekly quests separately
export async function getWeeklyQuests(): Promise<DailyQuest[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(dailyQuests).where(and(eq(dailyQuests.isActive, true), eq(dailyQuests.isWeekly, true)));
}

// Get daily quests only (not weekly)
export async function getDailyQuestsOnly(): Promise<DailyQuest[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(dailyQuests).where(and(eq(dailyQuests.isActive, true), eq(dailyQuests.isWeekly, false)));
}


// ==================== NEW QUESTS NOTIFICATION ====================

export async function sendNewQuestsNotification(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Create in-app notification
  await createNotification({
    userId,
    type: 'system',
    title: '🎯 Новые задания доступны!',
    message: 'Ежедневные задания обновились! Выполняйте задания и получайте бонусные баллы.',
    data: { type: 'new_quests' }
  });
}

export async function sendNewQuestsTelegramNotification(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const user = await getUserById(userId);
  if (!user?.telegramId) return;
  
  try {
    const { sendTelegramMessage } = await import('./telegramBot');
    await sendTelegramMessage(
      user.telegramId,
      `🎯 <b>Новые задания доступны!</b>\n\nЕжедневные задания обновились!\n\n📋 Выполняйте задания и получайте бонусные баллы:\n• Сделайте заказ — +500 баллов\n• Потратьте 30,000 UZS — +1,500 баллов\n• Посетите приложение — +100 баллов\n\n🔥 Не забывайте про серию дней!`
    );
  } catch (error) {
    console.error('[Telegram] Failed to send new quests notification:', error);
  }
}

export async function notifyAllUsersAboutNewQuests(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Get all users who have been active in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeUsers = await db.select().from(users)
    .where(sql`${users.lastSignedIn} >= ${thirtyDaysAgo}`);
  
  for (const user of activeUsers) {
    await sendNewQuestsNotification(user.id);
    await sendNewQuestsTelegramNotification(user.id);
  }
}
