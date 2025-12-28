import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Products API
  products: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProducts();
    }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductBySlug(input.slug);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),
    
    popular: publicProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ input }) => {
        return await db.getPopularProducts(input.limit);
      }),
    
    byCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductsByCategory(input.category);
      }),
  }),

  // Machines API
  machines: router({
    list: publicProcedure.query(async () => {
      return await db.getAllMachines();
    }),
    
    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return await db.getMachineByCode(input.code);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMachineById(input.id);
      }),
  }),

  // Favorites API
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserFavorites(ctx.user.id);
    }),
    
    add: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.addFavorite(ctx.user.id, input.productId);
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFavorite(ctx.user.id, input.productId);
        return { success: true };
      }),
    
    check: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.isFavorite(ctx.user.id, input.productId);
      }),
  }),

  // Cart API
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserCart(ctx.user.id);
    }),
    
    add: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().optional().default(1),
        machineId: z.number().optional(),
        customizations: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addToCart({
          userId: ctx.user.id,
          productId: input.productId,
          quantity: input.quantity,
          machineId: input.machineId,
          customizations: input.customizations,
        });
        return { success: true };
      }),
    
    updateQuantity: protectedProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateCartItemQuantity(input.id, input.quantity);
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeFromCart(input.id);
        return { success: true };
      }),
    
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearUserCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // Orders API
  orders: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(20) }))
      .query(async ({ ctx, input }) => {
        return await db.getUserOrders(ctx.user.id, input.limit);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        if (order && order.userId !== ctx.user.id) {
          return null; // Don't expose other users' orders
        }
        return order;
      }),
    
    getByNumber: protectedProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (order && order.userId !== ctx.user.id) {
          return null;
        }
        return order;
      }),
    
    create: protectedProcedure
      .input(z.object({
        machineId: z.number(),
        items: z.array(z.object({
          productId: z.number(),
          name: z.string(),
          price: z.number(),
          quantity: z.number(),
          customizations: z.any().optional(),
        })),
        subtotal: z.number(),
        discount: z.number().optional().default(0),
        total: z.number(),
        paymentMethod: z.enum(['click', 'payme', 'uzum', 'telegram', 'cash', 'bonus']),
        promoCode: z.string().optional(),
        promoDiscount: z.number().optional().default(0),
        pointsUsed: z.number().optional().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const orderNumber = `VH-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
        
        // Calculate points earned (1% of total)
        const pointsEarned = Math.floor(input.total * 0.01);
        
        const orderId = await db.createOrder({
          orderNumber,
          userId: ctx.user.id,
          machineId: input.machineId,
          items: input.items,
          subtotal: input.subtotal,
          discount: input.discount,
          total: input.total,
          paymentMethod: input.paymentMethod,
          promoCode: input.promoCode,
          promoDiscount: input.promoDiscount,
          pointsEarned,
          pointsUsed: input.pointsUsed,
        });
        
        // Update user stats
        await db.updateUserStats(ctx.user.id, input.total);
        
        // Add earned points
        if (pointsEarned > 0) {
          await db.updateUserPoints(ctx.user.id, pointsEarned);
        }
        
        // Deduct used points
        if (input.pointsUsed > 0) {
          await db.updateUserPoints(ctx.user.id, -input.pointsUsed);
        }
        
        // Increment promo code usage
        if (input.promoCode) {
          await db.incrementPromoCodeUsage(input.promoCode);
        }
        
        // Clear cart after order
        await db.clearUserCart(ctx.user.id);
        
        // Create notification
        await db.createNotification({
          userId: ctx.user.id,
          type: 'order',
          title: 'Заказ создан',
          message: `Ваш заказ ${orderNumber} успешно создан`,
          data: { orderId, orderNumber },
        });
        
        return { orderId, orderNumber, pointsEarned };
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']),
      }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
    
    updatePaymentStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
        chargeId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        if (!order || order.userId !== ctx.user.id) {
          return { success: false, error: 'Order not found' };
        }
        
        await db.updateOrderPaymentStatus(input.id, input.paymentStatus, input.chargeId);
        
        // If payment successful, update order status to confirmed
        if (input.paymentStatus === 'paid') {
          await db.updateOrderStatus(input.id, 'confirmed');
          
          // Create notification
          await db.createNotification({
            userId: ctx.user.id,
            type: 'order',
            title: 'Оплата получена',
            message: `Оплата заказа ${order.orderNumber} успешно получена`,
            data: { orderId: input.id, orderNumber: order.orderNumber },
          });
        }
        
        return { success: true };
      }),
  }),

  // Promo Codes API
  promo: router({
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const promo = await db.getPromoCode(input.code);
        
        if (!promo) {
          return { valid: false, error: 'Промокод не найден' };
        }
        
        if (promo.maxUses && promo.currentUses >= promo.maxUses) {
          return { valid: false, error: 'Промокод исчерпан' };
        }
        
        if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
          return { valid: false, error: 'Промокод истёк' };
        }
        
        return {
          valid: true,
          discountPercent: promo.discountPercent,
          minOrderAmount: promo.minOrderAmount,
        };
      }),
  }),

  // Notifications API
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ ctx, input }) => {
        return await db.getUserNotifications(ctx.user.id, input.limit);
      }),
    
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // User Profile API
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserById(ctx.user.id);
    }),
    
    stats: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) return null;
      
      return {
        pointsBalance: user.pointsBalance,
        loyaltyLevel: user.loyaltyLevel,
        totalSpent: user.totalSpent,
        totalOrders: user.totalOrders,
      };
    }),
  }),

  // Admin: Seed data
  admin: router({
    seedData: adminProcedure.mutation(async () => {
      await db.seedInitialData();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
