import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";

// Helper function to update quest progress on order
// Optimized: Uses batch operations to eliminate N+1 queries
async function updateQuestProgressOnOrder(userId: number, orderAmount: number) {
  // This now uses the optimized batch function that:
  // - Fetches all quests in 1 query
  // - Fetches all progress in 1 query
  // - Batch inserts missing progress records
  // - Batch inserts notifications
  await db.updateQuestProgressOnOrderBatch(userId, orderAmount);
}

// Helper function to update visit quest on app open
// Optimized: Reduced from 5+ queries to 3-4 queries
async function updateVisitQuestProgress(userId: number) {
  await db.updateVisitQuestProgressBatch(userId);
}

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
        quantity: z.number().min(1).max(99).optional().default(1),
        machineId: z.number().optional(),
        // Strict customizations schema to prevent injection
        customizations: z.object({
          size: z.enum(['small', 'medium', 'large']).optional(),
          sugar: z.number().min(0).max(5).optional(),
          milk: z.enum(['none', 'regular', 'oat', 'soy', 'almond']).optional(),
          temperature: z.enum(['hot', 'iced']).optional(),
          extras: z.array(z.string().max(50)).max(10).optional(),
        }).optional(),
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
        quantity: z.number().min(0).max(99),
      }))
      .mutation(async ({ ctx, input }) => {
        // Security: Pass userId to ensure user can only modify their own cart items
        const updated = await db.updateCartItemQuantity(input.id, input.quantity, ctx.user.id);
        if (!updated) {
          return { success: false, error: 'Cart item not found or access denied' };
        }
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Security: Pass userId to ensure user can only remove their own cart items
        const removed = await db.removeFromCart(input.id, ctx.user.id);
        if (!removed) {
          return { success: false, error: 'Cart item not found or access denied' };
        }
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
          name: z.string().max(200),
          price: z.number().min(0).max(10000000),
          quantity: z.number().min(1).max(99),
          // Strict customizations schema to prevent injection
          customizations: z.object({
            size: z.enum(['small', 'medium', 'large']).optional(),
            sugar: z.number().min(0).max(5).optional(),
            milk: z.enum(['none', 'regular', 'oat', 'soy', 'almond']).optional(),
            temperature: z.enum(['hot', 'iced']).optional(),
            extras: z.array(z.string().max(50)).max(10).optional(),
          }).optional(),
        })).min(1).max(50),
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

        // Validate points usage doesn't exceed balance
        if (input.pointsUsed > 0) {
          const user = await db.getUserById(ctx.user.id);
          if (!user || user.pointsBalance < input.pointsUsed) {
            throw new Error('Insufficient points balance');
          }
        }

        // Execute all order operations in a single transaction
        // This ensures data consistency - if any step fails, all changes are rolled back
        const result = await db.createOrderWithTransaction({
          order: {
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
          },
          userId: ctx.user.id,
          pointsEarned,
          pointsUsed: input.pointsUsed,
          promoCode: input.promoCode,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create order');
        }

        return {
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          pointsEarned: result.pointsEarned,
        };
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
          
          // Update daily quest progress for order
          await updateQuestProgressOnOrder(ctx.user.id, order.total);
          
          // Check for first order bonus
          const isFirst = await db.isFirstOrder(ctx.user.id);
          if (isFirst) {
            await db.grantFirstOrderBonus(ctx.user.id);
            
            // Create notification about first order bonus
            await db.createNotification({
              userId: ctx.user.id,
              type: 'bonus',
              title: '🎉 Бонус за первый заказ!',
              message: `Поздравляем с первым заказом! Вам начислено ${db.FIRST_ORDER_BONUS_AMOUNT.toLocaleString('ru-RU')} бонусных баллов!`,
              data: JSON.stringify({ amount: db.FIRST_ORDER_BONUS_AMOUNT, source: 'first_order_bonus' })
            });
            
            // Send Telegram notification if enabled
            const user = await db.getUserById(ctx.user.id);
            if (user?.telegramId) {
              const { sendFirstOrderBonusMessage } = await import('./telegramBot');
              const updatedUser = await db.getUserById(ctx.user.id);
              await sendFirstOrderBonusMessage(
                user.telegramId,
                db.FIRST_ORDER_BONUS_AMOUNT,
                updatedUser?.pointsBalance || 0
              );
            }
          }
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
      .mutation(async ({ ctx, input }) => {
        // Security: Pass userId to ensure user can only mark their own notifications as read
        const updated = await db.markNotificationAsRead(input.id, ctx.user.id);
        if (!updated) {
          return { success: false, error: 'Notification not found or access denied' };
        }
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
      
      // Update visit quest progress on app open
      await updateVisitQuestProgress(ctx.user.id);
      
      return {
        pointsBalance: user.pointsBalance,
        loyaltyLevel: user.loyaltyLevel,
        totalSpent: user.totalSpent,
        totalOrders: user.totalOrders,
        welcomeBonusReceived: (user as any).welcomeBonusReceived ?? false,
        referralCount: (user as any).referralCount ?? 0,
        telegramConnected: !!user.telegramId,
        currentStreak: (user as any).currentStreak ?? 0,
        longestStreak: (user as any).longestStreak ?? 0,
      };
    }),
    
    claimWelcomeBonus: protectedProcedure.mutation(async ({ ctx }) => {
      const granted = await db.grantWelcomeBonus(ctx.user.id);
      
      if (granted) {
        // Create notification about welcome bonus
        await db.createNotification({
          userId: ctx.user.id,
          type: 'bonus',
          title: 'Приветственный бонус!',
          message: `Вам начислено ${db.WELCOME_BONUS_AMOUNT.toLocaleString('ru-RU')} баллов за регистрацию! Это эквивалент бесплатного эспрессо ☕`,
          data: { amount: db.WELCOME_BONUS_AMOUNT, type: 'welcome_bonus' }
        });
        
        // Send Telegram notification if enabled
        const user = await db.getUserById(ctx.user.id);
        if (user?.telegramId) {
          const { sendTelegramMessage } = await import('./telegramBot');
          await sendTelegramMessage(
            user.telegramId,
            `🎁 <b>Приветственный бонус!</b>\n\nВам начислено <b>+${db.WELCOME_BONUS_AMOUNT.toLocaleString('ru-RU')} баллов</b> за регистрацию!\n\nЭто эквивалент бесплатного эспрессо ☕\n\nИспользуйте баллы для оплаты заказов!`
          );
        }
      }
      
      return { 
        success: granted, 
        amount: granted ? db.WELCOME_BONUS_AMOUNT : 0,
        message: granted ? 'Приветственный бонус начислен!' : 'Бонус уже был получен ранее'
      };
    }),
    
    // Send achievement notification
    notifyAchievement: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        category: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create in-app notification
        await db.createAchievementNotification(ctx.user.id, input);
        
        // Send Telegram notification
        await db.sendAchievementTelegramNotification(ctx.user.id, input);
        
        return { success: true };
      }),
    
    // Points history
    pointsHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(50) }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getPointsHistory(ctx.user.id, input?.limit || 50);
      }),
    
    // Daily quests
    dailyQuests: protectedProcedure.query(async ({ ctx }) => {
      // Auto-seed default quests if none exist (for new installations)
      await db.seedDailyQuests();
      
      const quests = await db.getAllDailyQuests();
      const today = new Date();
      const progress = await db.getUserDailyQuestProgress(ctx.user.id, today);
      
      // Initialize progress for ALL quests for this user (auto-creates for new users)
      for (const quest of quests) {
        const existingProgress = progress.find(p => p.questId === quest.id);
        if (!existingProgress) {
          await db.initializeDailyQuestProgress(ctx.user.id, quest.id, today);
        }
      }
      
      // Get updated progress
      const updatedProgress = await db.getUserDailyQuestProgress(ctx.user.id, today);
      
      return quests.map(quest => {
        const questProgress = updatedProgress.find(p => p.questId === quest.id);
        return {
          ...quest,
          currentValue: questProgress?.currentValue || 0,
          isCompleted: questProgress?.isCompleted || false,
          rewardClaimed: questProgress?.rewardClaimed || false,
        };
      });
    }),
    
    claimQuestReward: protectedProcedure
      .input(z.object({ questId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const today = new Date();
        const success = await db.claimDailyQuestReward(ctx.user.id, input.questId, today);
        return { success };
      }),
    
    // Leaderboard
    leaderboard: protectedProcedure
      .input(z.object({ 
        limit: z.number().optional().default(20),
        period: z.enum(['week', 'month', 'all']).optional().default('all')
      }).optional())
      .query(async ({ ctx, input }) => {
        const leaderboard = await db.getLeaderboard(input?.limit || 20, input?.period || 'all');
        const userRank = leaderboard.findIndex(u => u.userId === ctx.user.id) + 1;
        return {
          entries: leaderboard,
          currentUserRank: userRank > 0 ? userRank : null,
        };
      }),
  }),

  // Admin API
  admin: router({
    seedData: adminProcedure.mutation(async () => {
      await db.seedInitialData();
      return { success: true };
    }),
    
    // Products CRUD
    products: router({
      create: adminProcedure
        .input(z.object({
          slug: z.string(),
          name: z.string(),
          nameRu: z.string().optional(),
          nameUz: z.string().optional(),
          description: z.string().optional(),
          descriptionRu: z.string().optional(),
          descriptionUz: z.string().optional(),
          price: z.number(),
          category: z.enum(['coffee', 'tea', 'cold_drinks', 'snacks', 'other']).default('coffee'),
          imageUrl: z.string().optional(),
          isAvailable: z.boolean().default(true),
          isPopular: z.boolean().default(false),
        }))
        .mutation(async ({ input }) => {
          return await db.createProduct(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          slug: z.string().optional(),
          name: z.string().optional(),
          nameRu: z.string().optional(),
          nameUz: z.string().optional(),
          description: z.string().optional(),
          descriptionRu: z.string().optional(),
          descriptionUz: z.string().optional(),
          price: z.number().optional(),
          category: z.enum(['coffee', 'tea', 'cold_drinks', 'snacks', 'other']).optional(),
          imageUrl: z.string().optional(),
          isAvailable: z.boolean().optional(),
          isPopular: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateProduct(id, data);
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteProduct(input.id);
          return { success: true };
        }),
    }),
    
    // Orders management
    orders: router({
      list: adminProcedure
        .input(z.object({
          limit: z.number().optional().default(50),
          status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']).optional(),
        }))
        .query(async ({ input }) => {
          return await db.getAllOrders(input.limit, input.status);
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
    }),
    
    // Promo codes CRUD
    promo: router({
      list: adminProcedure.query(async () => {
        return await db.getAllPromoCodes();
      }),
      
      create: adminProcedure
        .input(z.object({
          code: z.string(),
          discountPercent: z.number(),
          minOrderAmount: z.number().optional().default(0),
          maxUses: z.number().optional(),
          expiresAt: z.date().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createPromoCode(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          code: z.string().optional(),
          discountPercent: z.number().optional(),
          minOrderAmount: z.number().optional(),
          maxUses: z.number().optional(),
          expiresAt: z.date().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updatePromoCode(id, data);
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deletePromoCode(input.id);
          return { success: true };
        }),
    }),
    
    // Daily Quests management
    quests: router({
      list: adminProcedure.query(async () => {
        return await db.getAllDailyQuests();
      }),
      
      seed: adminProcedure.mutation(async () => {
        await db.seedDailyQuests();
        return { success: true };
      }),
      
      create: adminProcedure
        .input(z.object({
          questKey: z.string(),
          title: z.string(),
          description: z.string(),
          type: z.enum(['order', 'spend', 'visit', 'referral', 'share', 'review']),
          targetValue: z.number(),
          rewardPoints: z.number(),
          isWeekly: z.boolean().default(false),
          isActive: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
          return await db.createDailyQuest(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          targetValue: z.number().optional(),
          rewardPoints: z.number().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateDailyQuest(id, data);
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteDailyQuest(input.id);
          return { success: true };
        }),
      
      // Send notification to all users about new quests
      notifyUsers: adminProcedure.mutation(async () => {
        await db.notifyAllUsersAboutNewQuests();
        return { success: true, message: 'Уведомления отправлены всем активным пользователям' };
      }),
      
      // Manual reset daily quests (for testing/admin)
      resetDaily: adminProcedure.mutation(async () => {
        const { triggerDailyReset } = await import('./scheduledTasks');
        await triggerDailyReset();
        return { success: true, message: 'Ежедневные задания сброшены' };
      }),
      
      // Manual reset weekly quests (for testing/admin)
      resetWeekly: adminProcedure.mutation(async () => {
        const { triggerWeeklyReset } = await import('./scheduledTasks');
        await triggerWeeklyReset();
        return { success: true, message: 'Недельные задания сброшены' };
      }),
    }),
    
    // Machines management
    machines: router({
      list: adminProcedure.query(async () => {
        return await db.getAllMachines();
      }),
      
      create: adminProcedure
        .input(z.object({
          machineCode: z.string(),
          name: z.string(),
          model: z.string().optional(),
          serialNumber: z.string().optional(),
          manufacturer: z.string().optional(),
          address: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          status: z.enum(['online', 'offline', 'maintenance', 'inactive']).default('online'),
          assignedEmployeeId: z.number().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createMachine(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          machineCode: z.string().optional(),
          name: z.string().optional(),
          model: z.string().optional(),
          serialNumber: z.string().optional(),
          manufacturer: z.string().optional(),
          address: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          status: z.enum(['online', 'offline', 'maintenance', 'inactive']).optional(),
          assignedEmployeeId: z.number().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateMachine(id, data);
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteMachine(input.id);
          return { success: true };
        }),
      
      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(['online', 'offline', 'maintenance', 'inactive']),
        }))
        .mutation(async ({ input }) => {
          await db.updateMachineStatus(input.id, input.status);
          return { success: true };
        }),
    }),
    
    // Employees management
    employees: router({
      list: adminProcedure.query(async () => {
        return await db.getAllEmployees();
      }),
      
      create: adminProcedure
        .input(z.object({
          fullName: z.string(),
          phone: z.string().optional(),
          email: z.string().optional(),
          username: z.string().optional(),
          role: z.enum(['platform_owner', 'platform_admin', 'org_owner', 'org_admin', 'manager', 'supervisor', 'operator', 'technician', 'collector', 'warehouse_manager', 'warehouse_worker', 'accountant', 'investor']).default('operator'),
          status: z.enum(['pending', 'active', 'inactive', 'suspended']).default('active'),
          telegramUsername: z.string().optional(),
          salary: z.number().default(0),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createEmployee(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          fullName: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          username: z.string().optional(),
          role: z.enum(['platform_owner', 'platform_admin', 'org_owner', 'org_admin', 'manager', 'supervisor', 'operator', 'technician', 'collector', 'warehouse_manager', 'warehouse_worker', 'accountant', 'investor']).optional(),
          status: z.enum(['pending', 'active', 'inactive', 'suspended']).optional(),
          telegramUsername: z.string().optional(),
          salary: z.number().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateEmployee(id, data);
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteEmployee(input.id);
          return { success: true };
        }),
    }),
    
    // Dashboard stats
    stats: adminProcedure.query(async () => {
      return await db.getAdminStats();
    }),
    
    // Ingredients management
    ingredients: router({
      list: adminProcedure.query(async () => {
        return await db.getAllIngredients();
      }),
      
      create: adminProcedure
        .input(z.object({
          name: z.string(),
          category: z.enum(['coffee', 'milk', 'sugar', 'syrup', 'powder', 'water', 'other']).default('other'),
          unit: z.string().default('g'),
          costPerUnit: z.number().default(0),
          minStockLevel: z.number().default(100),
          description: z.string().optional(),
          isActive: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
          return await db.createIngredient(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          category: z.enum(['coffee', 'milk', 'sugar', 'syrup', 'powder', 'water', 'other']).optional(),
          unit: z.string().optional(),
          costPerUnit: z.number().optional(),
          minStockLevel: z.number().optional(),
          description: z.string().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateIngredient(id, data);
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteIngredient(input.id);
          return { success: true };
        }),
      
      bulkDelete: adminProcedure
        .input(z.object({ ids: z.array(z.number()) }))
        .mutation(async ({ input }) => {
          await db.bulkDeleteIngredients(input.ids);
          return { success: true, count: input.ids.length };
        }),
      
      bulkUpdateStatus: adminProcedure
        .input(z.object({
          ids: z.array(z.number()),
          isActive: z.boolean(),
        }))
        .mutation(async ({ input }) => {
          await db.bulkUpdateIngredientStatus(input.ids, input.isActive);
          return { success: true, count: input.ids.length };
        }),
    }),
    
    // Bunkers management
    bunkers: router({
      list: adminProcedure.query(async () => {
        return await db.getAllBunkers();
      }),
      
      byMachine: adminProcedure
        .input(z.object({ machineId: z.number() }))
        .query(async ({ input }) => {
          return await db.getBunkersByMachineId(input.machineId);
        }),
      
      create: adminProcedure
        .input(z.object({
          machineId: z.number(),
          ingredientId: z.number().nullable().optional(),
          bunkerNumber: z.number(),
          capacity: z.number(),
          currentLevel: z.number().default(0),
          lowLevelThreshold: z.number().default(20),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createBunker(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          machineId: z.number().optional(),
          ingredientId: z.number().nullable().optional(),
          bunkerNumber: z.number().optional(),
          capacity: z.number().optional(),
          currentLevel: z.number().optional(),
          lowLevelThreshold: z.number().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateBunker(id, data);
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteBunker(input.id);
          return { success: true };
        }),
      
      refill: adminProcedure
        .input(z.object({
          id: z.number(),
          newLevel: z.number(),
          employeeId: z.number(),
        }))
        .mutation(async ({ input }) => {
          return await db.refillBunker(input.id, input.newLevel, input.employeeId);
        }),
      
      bulkDelete: adminProcedure
        .input(z.object({ ids: z.array(z.number()) }))
        .mutation(async ({ input }) => {
          await db.bulkDeleteBunkers(input.ids);
          return { success: true, count: input.ids.length };
        }),
      
      bulkRefill: adminProcedure
        .input(z.object({
          ids: z.array(z.number()),
          fillPercentage: z.number().min(0).max(100),
          employeeId: z.number(),
        }))
        .mutation(async ({ input }) => {
          await db.bulkRefillBunkers(input.ids, input.fillPercentage, input.employeeId);
          return { success: true, count: input.ids.length };
        }),
    }),
    
    // Mixers management
    mixers: router({
      list: adminProcedure.query(async () => {
        return await db.getAllMixers();
      }),
      
      byMachine: adminProcedure
        .input(z.object({ machineId: z.number() }))
        .query(async ({ input }) => {
          return await db.getMixersByMachineId(input.machineId);
        }),
      
      create: adminProcedure
        .input(z.object({
          machineId: z.number(),
          mixerNumber: z.number(),
          mixerType: z.enum(['main', 'secondary', 'whisk', 'grinder']).default('main'),
          status: z.enum(['operational', 'needs_cleaning', 'needs_repair', 'replaced']).default('operational'),
          totalCycles: z.number().default(0),
          maxCyclesBeforeMaintenance: z.number().default(10000),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createMixer(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          machineId: z.number().optional(),
          mixerNumber: z.number().optional(),
          mixerType: z.enum(['main', 'secondary', 'whisk', 'grinder']).optional(),
          status: z.enum(['operational', 'needs_cleaning', 'needs_repair', 'replaced']).optional(),
          totalCycles: z.number().optional(),
          maxCyclesBeforeMaintenance: z.number().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateMixer(id, data);
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteMixer(input.id);
          return { success: true };
        }),
      
      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(['operational', 'needs_cleaning', 'needs_repair', 'replaced']),
        }))
        .mutation(async ({ input }) => {
          return await db.updateMixerStatus(input.id, input.status);
        }),
      
      recordMaintenance: adminProcedure
        .input(z.object({
          id: z.number(),
          employeeId: z.number(),
        }))
        .mutation(async ({ input }) => {
          return await db.recordMixerMaintenance(input.id, input.employeeId);
        }),
      
      bulkDelete: adminProcedure
        .input(z.object({ ids: z.array(z.number()) }))
        .mutation(async ({ input }) => {
          await db.bulkDeleteMixers(input.ids);
          return { success: true, count: input.ids.length };
        }),
      
      bulkUpdateStatus: adminProcedure
        .input(z.object({
          ids: z.array(z.number()),
          status: z.enum(['operational', 'needs_cleaning', 'needs_repair', 'replaced']),
        }))
        .mutation(async ({ input }) => {
          await db.bulkUpdateMixerStatus(input.ids, input.status);
          return { success: true, count: input.ids.length };
        }),
    }),

    // Machine Assignments
    machineAssignments: router({
      list: adminProcedure.query(async () => {
        return await db.getAllMachineAssignments();
      }),

      active: adminProcedure.query(async () => {
        return await db.getActiveMachineAssignments();
      }),

      byEmployee: adminProcedure
        .input(z.object({ employeeId: z.number() }))
        .query(async ({ input }) => {
          return await db.getMachineAssignmentsByEmployee(input.employeeId);
        }),

      activeByEmployee: adminProcedure
        .input(z.object({ employeeId: z.number() }))
        .query(async ({ input }) => {
          return await db.getActiveMachineAssignmentsByEmployee(input.employeeId);
        }),

      byMachine: adminProcedure
        .input(z.object({ machineId: z.number() }))
        .query(async ({ input }) => {
          return await db.getMachineAssignmentsByMachine(input.machineId);
        }),

      activeByMachine: adminProcedure
        .input(z.object({ machineId: z.number() }))
        .query(async ({ input }) => {
          return await db.getActiveMachineAssignmentsByMachine(input.machineId);
        }),

      create: adminProcedure
        .input(z.object({
          machineId: z.number(),
          employeeId: z.number(),
          assignmentType: z.enum(['primary', 'secondary', 'temporary']).default('primary'),
          assignmentStatus: z.enum(['active', 'inactive', 'pending']).default('active'),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          responsibilities: z.string().optional(),
          notes: z.string().optional(),
          assignedBy: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          const assignment = await db.createMachineAssignment(input);
          if (assignment) {
            await db.updateEmployeePerformanceOnAssignment(input.employeeId);
          }
          return assignment;
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          machineId: z.number().optional(),
          employeeId: z.number().optional(),
          assignmentType: z.enum(['primary', 'secondary', 'temporary']).optional(),
          assignmentStatus: z.enum(['active', 'inactive', 'pending']).optional(),
          endDate: z.date().optional(),
          responsibilities: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          const assignment = await db.updateMachineAssignment(id, updates);
          if (assignment && updates.employeeId) {
            await db.updateEmployeePerformanceOnAssignment(updates.employeeId);
          }
          return assignment;
        }),

      deactivate: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          return await db.deactivateMachineAssignment(input.id);
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteMachineAssignment(input.id);
          return { success: true };
        }),
    }),

    // Work Logs
    workLogs: router({
      list: adminProcedure.query(async () => {
        return await db.getAllWorkLogs();
      }),

      byEmployee: adminProcedure
        .input(z.object({ employeeId: z.number() }))
        .query(async ({ input }) => {
          return await db.getWorkLogsByEmployee(input.employeeId);
        }),

      byMachine: adminProcedure
        .input(z.object({ machineId: z.number() }))
        .query(async ({ input }) => {
          return await db.getWorkLogsByMachine(input.machineId);
        }),

      byDateRange: adminProcedure
        .input(z.object({
          startDate: z.date(),
          endDate: z.date(),
        }))
        .query(async ({ input }) => {
          return await db.getWorkLogsByDateRange(input.startDate, input.endDate);
        }),

      inProgress: adminProcedure.query(async () => {
        return await db.getInProgressWorkLogs();
      }),

      create: adminProcedure
        .input(z.object({
          employeeId: z.number(),
          machineId: z.number().optional(),
          workType: z.enum(['maintenance', 'refill', 'cleaning', 'repair', 'inspection', 'installation', 'other']),
          description: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createWorkLog({
            ...input,
            workStatus: 'in_progress',
            startTime: new Date(),
          });
        }),

      complete: adminProcedure
        .input(z.object({
          id: z.number(),
          notes: z.string().optional(),
          rating: z.number().min(1).max(5).optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.completeWorkLog(input.id, new Date(), input.notes, input.rating);
        }),

      cancel: adminProcedure
        .input(z.object({
          id: z.number(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.cancelWorkLog(input.id, input.notes);
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          workType: z.enum(['maintenance', 'refill', 'cleaning', 'repair', 'inspection', 'installation', 'other']).optional(),
          description: z.string().optional(),
          notes: z.string().optional(),
          issuesFound: z.string().optional(),
          partsUsed: z.string().optional(),
          photoUrls: z.string().optional(),
          rating: z.number().min(1).max(5).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          return await db.updateWorkLog(id, updates);
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteWorkLog(input.id);
          return { success: true };
        }),
    }),

    // Employee Performance
    employeePerformance: router({
      list: adminProcedure.query(async () => {
        return await db.getAllEmployeePerformance();
      }),

      byEmployee: adminProcedure
        .input(z.object({ employeeId: z.number() }))
        .query(async ({ input }) => {
          return await db.getEmployeePerformance(input.employeeId);
        }),

      initialize: adminProcedure
        .input(z.object({ employeeId: z.number() }))
        .mutation(async ({ input }) => {
          return await db.initializeEmployeePerformance(input.employeeId);
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
