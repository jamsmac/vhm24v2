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
  InsertNotification, notifications
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
