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
    
    nearby: publicProcedure
      .input(z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        limit: z.number().min(1).max(50).optional().default(10),
        maxDistanceKm: z.number().min(1).max(100).optional().default(50),
      }))
      .query(async ({ input }) => {
        return await db.getNearbyMachines(
          input.latitude,
          input.longitude,
          input.limit,
          input.maxDistanceKm
        );
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
        
        // Add earned points with transaction record
        if (pointsEarned > 0) {
          await db.addPointsTransaction(
            ctx.user.id,
            pointsEarned,
            'order_reward',
            `Кэшбэк за заказ ${orderNumber}`,
            'order',
            orderId
          );
        }
        
        // Deduct used points with transaction record
        if (input.pointsUsed > 0) {
          await db.addPointsTransaction(
            ctx.user.id,
            -input.pointsUsed,
            'redemption',
            `Оплата баллами заказа ${orderNumber}`,
            'order',
            orderId
          );
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
    
    // Machines management
    machines: router({
      list: adminProcedure.query(async () => {
        return await db.getAllMachines();
      }),
      
      create: adminProcedure
        .input(z.object({
          machineCode: z.string(),
          name: z.string(),
          address: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          status: z.enum(['online', 'offline', 'maintenance']).default('online'),
          imageUrl: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createMachine(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          machineCode: z.string().optional(),
          name: z.string().optional(),
          address: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          status: z.enum(['online', 'offline', 'maintenance']).optional(),
          imageUrl: z.string().optional(),
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
          status: z.enum(['online', 'offline', 'maintenance']),
        }))
        .mutation(async ({ input }) => {
          await db.updateMachineStatus(input.id, input.status);
          return { success: true };
        }),
      
      // Inventory management
      getInventory: adminProcedure
        .input(z.object({ machineId: z.number() }))
        .query(async ({ input }) => {
          return await db.getMachineInventory(input.machineId);
        }),
      
      updateInventory: adminProcedure
        .input(z.object({
          machineId: z.number(),
          productId: z.number(),
          currentStock: z.number(),
        }))
        .mutation(async ({ input }) => {
          await db.updateMachineInventory(input.machineId, input.productId, input.currentStock);
          return { success: true };
        }),
      
      // Maintenance logs
      getMaintenanceLogs: adminProcedure
        .input(z.object({ machineId: z.number() }))
        .query(async ({ input }) => {
          return await db.getMachineMaintenanceLogs(input.machineId);
        }),
      
      addMaintenanceLog: adminProcedure
        .input(z.object({
          machineId: z.number(),
          type: z.enum(['routine', 'repair', 'restock', 'cleaning', 'other']).default('routine'),
          description: z.string().optional(),
          performedBy: z.string().optional(),
          cost: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.addMaintenanceLog(input);
        }),
    }),
    
    // Dashboard stats
    stats: adminProcedure.query(async () => {
      return await db.getAdminStats();
    }),
  }),

  // Gamification API
  gamification: router({
    // Get user's tasks with progress
    tasks: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserTasksWithProgress(ctx.user.id);
    }),
    
    // Get user's points balance
    points: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPointsBalance(ctx.user.id);
    }),
    
    // Get points history
    pointsHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ ctx, input }) => {
        return await db.getUserPointsHistory(ctx.user.id, input.limit);
      }),
    
    // Complete a task
    completeTask: protectedProcedure
      .input(z.object({ taskSlug: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return await db.completeTask(ctx.user.id, input.taskSlug);
      }),
    
    // Link email (complete link_email task)
    linkEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        // Update user's email
        await db.updateUserEmail(ctx.user.id, input.email);
        
        // Complete the task
        const result = await db.completeTask(ctx.user.id, 'link_email');
        
        return {
          emailUpdated: true,
          ...result,
        };
      }),
    
    // Check and complete daily login task
    dailyLogin: protectedProcedure.mutation(async ({ ctx }) => {
      return await db.completeTask(ctx.user.id, 'daily_login');
    }),
    
    // Admin: Get all tasks
    adminTasks: adminProcedure
      .input(z.object({ includeInactive: z.boolean().optional().default(false) }))
      .query(async ({ input }) => {
        return await db.getAllTasks(input.includeInactive);
      }),
    
    // Admin: Create task
    adminCreateTask: adminProcedure
      .input(z.object({
        slug: z.string(),
        title: z.string(),
        titleRu: z.string().optional(),
        description: z.string().optional(),
        descriptionRu: z.string().optional(),
        taskType: z.enum([
          'link_telegram', 'link_email', 'first_order', 'order_count',
          'spend_amount', 'referral', 'daily_login', 'review', 'social_share', 'custom'
        ]),
        pointsReward: z.number(),
        requiredValue: z.number().optional().default(1),
        isRepeatable: z.boolean().optional().default(false),
        repeatCooldownHours: z.number().optional(),
        maxCompletions: z.number().optional(),
        iconName: z.string().optional(),
        sortOrder: z.number().optional().default(0),
        isActive: z.boolean().optional().default(true),
        startsAt: z.date().optional(),
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const taskId = await db.createTask(input);
        return { success: true, taskId };
      }),
    
    // Admin: Update task
    adminUpdateTask: adminProcedure
      .input(z.object({
        id: z.number(),
        slug: z.string().optional(),
        title: z.string().optional(),
        titleRu: z.string().optional(),
        description: z.string().optional(),
        descriptionRu: z.string().optional(),
        pointsReward: z.number().optional(),
        requiredValue: z.number().optional(),
        isRepeatable: z.boolean().optional(),
        repeatCooldownHours: z.number().optional(),
        maxCompletions: z.number().optional(),
        iconName: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        startsAt: z.date().optional(),
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTask(id, data);
        return { success: true };
      }),
    
    // Admin: Delete task
    adminDeleteTask: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTask(input.id);
        return { success: true };
      }),
    
    // Admin: Adjust user points
    adminAdjustPoints: adminProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.number(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addPointsTransaction(
          input.userId,
          input.amount,
          'admin_adjustment',
          input.description || 'Admin adjustment'
        );
        return { success: true };
      }),
    
    // Seed default tasks (admin only)
    seedTasks: adminProcedure.mutation(async () => {
      await db.seedDefaultTasks();
      return { success: true };
    }),
    
    // Get user preferences (for home customization)
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPreferences(ctx.user.id);
    }),
    
    // Update user preferences
    updatePreferences: protectedProcedure
      .input(z.object({
        homeSections: z.any().optional(),
        language: z.string().optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        notificationsEnabled: z.boolean().optional(),
        pointsNotifications: z.object({
          taskCompletion: z.boolean(),
          orderReward: z.boolean(),
          referralBonus: z.boolean(),
          adminAdjustment: z.boolean(),
          redemption: z.boolean(),
          expiration: z.boolean(),
          telegramEnabled: z.boolean(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // User Preferences API
  preferences: router({
    // Get user preferences
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPreferences(ctx.user.id);
    }),
    
    // Update user preferences
    update: protectedProcedure
      .input(z.object({
        homeSections: z.any().optional(),
        language: z.string().optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        notificationsEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Referral System API
  referral: router({
    // Get user's referral code and stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getReferralStats(ctx.user.id);
    }),
    
    // Get user's referral code (creates one if doesn't exist)
    getCode: protectedProcedure.query(async ({ ctx }) => {
      const codeData = await db.getOrCreateReferralCode(ctx.user.id);
      return codeData ? { code: codeData.code } : null;
    }),
    
    // Get list of user's referrals
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserReferrals(ctx.user.id);
    }),
    
    // Track a referral click (public - no auth needed)
    trackClick: publicProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input }) => {
        const success = await db.trackReferralClick(input.code);
        return { success };
      }),
    
    // Validate a referral code (public - for registration flow)
    validateCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const codeData = await db.getReferralCodeByCode(input.code);
        return { 
          valid: codeData !== null && codeData.isActive,
          code: codeData?.code || null
        };
      }),
    
    // Apply referral code after registration
    applyCode: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Create the referral record
        const referral = await db.createReferral(input.code, ctx.user.id);
        if (!referral) {
          return { success: false, error: 'Invalid or already used referral code' };
        }
        
        // Complete the referral and award points
        const completed = await db.completeReferral(ctx.user.id, 200, 100);
        
        return { 
          success: completed,
          referrerPoints: 200,
          referredPoints: 100
        };
      }),
    
    // Check if current user was referred
    getReferrer: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserReferrer(ctx.user.id);
    }),
  }),

  // Rewards Store API
  rewards: router({
    // Get all active rewards
    list: publicProcedure.query(async () => {
      return await db.getActiveRewards();
    }),
    
    // Get reward by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getRewardById(input.id);
      }),
    
    // Claim a reward (points are awarded immediately)
    purchase: protectedProcedure
      .input(z.object({ rewardId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.purchaseReward(ctx.user.id, input.rewardId);
      }),
    
    // Get user's claimed rewards
    myRewards: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserRewards(ctx.user.id);
      }),
    
    // Admin: Get all rewards
    adminList: adminProcedure.query(async () => {
      return await db.getAllRewards();
    }),
    
    // Admin: Create reward
    adminCreate: adminProcedure
      .input(z.object({
        slug: z.string(),
        name: z.string(),
        nameRu: z.string().optional(),
        description: z.string().optional(),
        descriptionRu: z.string().optional(),
        imageUrl: z.string().optional(),
        rewardType: z.enum(['bonus_points', 'promo_code', 'free_drink', 'discount_percent', 'discount_fixed', 'custom']),
        pointsCost: z.number(),
        pointsAwarded: z.number().optional(),
        promoCode: z.string().optional(),
        stockLimit: z.number().optional(),
        maxPerUser: z.number().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const reward = await db.createReward(input);
        return { success: !!reward, reward };
      }),
    
    // Admin: Update reward
    adminUpdate: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          nameRu: z.string().optional(),
          description: z.string().optional(),
          descriptionRu: z.string().optional(),
          imageUrl: z.string().optional(),
          pointsCost: z.number().optional(),
          pointsAwarded: z.number().optional(),
          promoCode: z.string().optional(),
          stockLimit: z.number().optional(),
          stockRemaining: z.number().optional(),
          maxPerUser: z.number().optional(),
          sortOrder: z.number().optional(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const success = await db.updateReward(input.id, input.data);
        return { success };
      }),
    
    // Admin: Delete reward
    adminDelete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteReward(input.id);
        return { success };
      }),
    
    // Admin: Seed default rewards
    adminSeed: adminProcedure.mutation(async () => {
      await db.seedDefaultRewards();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
