import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";

// Helper function to update quest progress on order
async function updateQuestProgressOnOrder(userId: number, orderAmount: number) {
  const today = new Date();
  const quests = await db.getAllDailyQuests();
  
  for (const quest of quests) {
    // Initialize progress if not exists
    await db.initializeDailyQuestProgress(userId, quest.id, today);
    
    // Get current progress
    const progressList = await db.getUserDailyQuestProgress(userId, today);
    const progress = progressList.find(p => p.questId === quest.id);
    
    if (!progress || progress.isCompleted) continue;
    
    let newValue = progress.currentValue;
    let isCompleted = false;
    
    if (quest.type === 'order') {
      newValue = progress.currentValue + 1;
      isCompleted = newValue >= quest.targetValue;
    } else if (quest.type === 'spend') {
      newValue = progress.currentValue + orderAmount;
      isCompleted = newValue >= quest.targetValue;
    }
    
    if (newValue !== progress.currentValue) {
      await db.updateDailyQuestProgress(userId, quest.id, today, newValue, isCompleted);
      
      // Send notification if quest completed
      if (isCompleted && !progress.isCompleted) {
        await db.createNotification({
          userId,
          type: 'bonus',
          title: '✅ Задание выполнено!',
          message: `Вы выполнили задание "${quest.title}". Нажмите, чтобы получить награду!`,
          data: { questId: quest.id, reward: quest.rewardPoints }
        });
      }
    }
  }
}

// Helper function to update visit quest on app open
async function updateVisitQuestProgress(userId: number) {
  const today = new Date();
  const quests = await db.getAllDailyQuests();
  
  const visitQuest = quests.find(q => q.type === 'visit');
  if (!visitQuest) return;
  
  await db.initializeDailyQuestProgress(userId, visitQuest.id, today);
  
  const progressList = await db.getUserDailyQuestProgress(userId, today);
  const progress = progressList.find(p => p.questId === visitQuest.id);
  
  if (!progress || progress.isCompleted) return;
  
  await db.updateDailyQuestProgress(userId, visitQuest.id, today, 1, true);
  
  await db.createNotification({
    userId,
    type: 'bonus',
    title: '✅ Задание выполнено!',
    message: `Вы выполнили задание "${visitQuest.title}". Нажмите, чтобы получить награду!`,
    data: { questId: visitQuest.id, reward: visitQuest.rewardPoints }
  });
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
              data: { amount: db.FIRST_ORDER_BONUS_AMOUNT, type: 'first_order_bonus' }
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
    }),
    
    // Machines management
    machines: router({
      list: adminProcedure.query(async () => {
        return await db.getAllMachines();
      }),
      
      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(['online', 'offline', 'maintenance']),
        }))
        .mutation(async ({ input }) => {
          await db.updateMachineStatus(input.id, input.status);
          return { success: true };
        }),
    }),
    
    // Dashboard stats
    stats: adminProcedure.query(async () => {
      return await db.getAdminStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
