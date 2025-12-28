/**
 * Hook for syncing local Zustand stores with database via tRPC
 * Provides seamless offline-first experience with server persistence
 */

import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useCartStore } from '@/stores/cartStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { useUserStore } from '@/stores/userStore';

export function useDataSync() {
  const { isAuthenticated } = useAuth();
  
  // Fetch user profile and stats
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const { data: stats } = trpc.profile.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  
  // Fetch cart from server
  const { data: serverCart } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fetch favorites from server
  const { data: serverFavorites } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  
  // Fetch orders from server
  const { data: serverOrders } = trpc.orders.list.useQuery({ limit: 50 }, {
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
  
  // Sync user profile to local store
  useEffect(() => {
    if (profile && stats) {
      const userStore = useUserStore.getState();
      userStore.setProfile({
        id: profile.id.toString(),
        telegramId: profile.telegramId || '',
        telegramUsername: profile.telegramUsername || undefined,
        firstName: profile.telegramFirstName || profile.name || 'Гость',
        lastName: profile.telegramLastName || undefined,
        phone: undefined,
        email: profile.email || undefined,
        language: 'ru',
        isVerified: true,
      });
      userStore.setLoyalty({
        pointsBalance: stats.pointsBalance,
        lifetimePoints: stats.totalSpent,
        level: stats.loyaltyLevel as 'bronze' | 'silver' | 'gold' | 'platinum',
        nextLevelPoints: getNextLevelPoints(stats.loyaltyLevel),
        pointsToNextLevel: getNextLevelPoints(stats.loyaltyLevel) - stats.totalSpent,
      });
    }
  }, [profile, stats]);
  
  // Sync cart to local store
  useEffect(() => {
    if (serverCart && serverCart.length > 0) {
      const cartStore = useCartStore.getState();
      // Only sync if local cart is empty (to avoid overwriting local changes)
      if (cartStore.items.length === 0) {
        serverCart.forEach(item => {
          cartStore.addItem({
            id: item.product.slug,
            name: item.product.nameRu || item.product.name,
            price: item.product.price,
            image: item.product.imageUrl || '',
            category: item.product.category,
            isAvailable: item.product.isAvailable,
          });
          // Update quantity if more than 1
          if (item.quantity > 1) {
            cartStore.updateQuantity(item.product.slug, item.quantity);
          }
        });
      }
    }
  }, [serverCart]);
  
  // Sync favorites to local store
  useEffect(() => {
    if (serverFavorites && serverFavorites.length > 0) {
      const favoritesStore = useFavoritesStore.getState();
      // Clear and re-add from server
      favoritesStore.clearFavorites();
      serverFavorites.forEach(fav => {
        favoritesStore.addFavorite({
          id: fav.product.slug,
          name: fav.product.nameRu || fav.product.name,
          description: fav.product.descriptionRu || fav.product.description || '',
          price: fav.product.price,
          image: fav.product.imageUrl || '',
          category: fav.product.category,
        });
      });
    }
  }, [serverFavorites]);
  
  // Sync orders to local store
  useEffect(() => {
    if (serverOrders && serverOrders.length > 0) {
      const orderStore = useOrderHistoryStore.getState();
      // Clear and re-add from server
      orderStore.clearHistory();
      serverOrders.forEach(order => {
        const items = order.items as any[];
        orderStore.addOrder({
          items: items.map(item => ({
            id: item.productId?.toString() || item.name,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: '',
            category: item.category || 'coffee',
          })),
          total: order.total,
          status: order.status as any,
          machineId: order.machineId.toString(),
          machineName: 'Автомат',
          locationName: '',
          completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
          bonusEarned: order.pointsEarned,
        });
      });
    }
  }, [serverOrders]);
  
  return {
    isLoading: !profile && isAuthenticated,
    profile,
    stats,
  };
}

// Helper to get next level points threshold
function getNextLevelPoints(currentLevel: string): number {
  const thresholds: Record<string, number> = {
    bronze: 100000,
    silver: 500000,
    gold: 1000000,
    platinum: 5000000,
  };
  return thresholds[currentLevel] || 100000;
}

/**
 * Hook for cart operations with server sync
 */
export function useServerCart() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const addMutation = trpc.cart.add.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  
  const updateMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  
  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  
  const clearMutation = trpc.cart.clear.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  
  return {
    addToCart: async (productId: number, quantity = 1, machineId?: number, customizations?: any) => {
      if (!isAuthenticated) return;
      await addMutation.mutateAsync({ productId, quantity, machineId, customizations });
    },
    updateQuantity: async (id: number, quantity: number) => {
      if (!isAuthenticated) return;
      await updateMutation.mutateAsync({ id, quantity });
    },
    removeFromCart: async (id: number) => {
      if (!isAuthenticated) return;
      await removeMutation.mutateAsync({ id });
    },
    clearCart: async () => {
      if (!isAuthenticated) return;
      await clearMutation.mutateAsync();
    },
    isLoading: addMutation.isPending || updateMutation.isPending || removeMutation.isPending,
  };
}

/**
 * Hook for favorites operations with server sync
 */
export function useServerFavorites() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const addMutation = trpc.favorites.add.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
  });
  
  const removeMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
  });
  
  return {
    addFavorite: async (productId: number) => {
      if (!isAuthenticated) return;
      await addMutation.mutateAsync({ productId });
    },
    removeFavorite: async (productId: number) => {
      if (!isAuthenticated) return;
      await removeMutation.mutateAsync({ productId });
    },
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}

/**
 * Hook for creating orders with server sync
 */
export function useServerOrders() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const createMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      utils.cart.get.invalidate();
      utils.profile.stats.invalidate();
    },
  });
  
  const updatePaymentMutation = trpc.orders.updatePaymentStatus.useMutation({
    onSuccess: () => utils.orders.list.invalidate(),
  });
  
  return {
    createOrder: async (orderData: Parameters<typeof createMutation.mutateAsync>[0]) => {
      if (!isAuthenticated) return null;
      return await createMutation.mutateAsync(orderData);
    },
    updatePaymentStatus: async (id: number, paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded', chargeId?: string) => {
      if (!isAuthenticated) return;
      await updatePaymentMutation.mutateAsync({ id, paymentStatus, chargeId });
    },
    isLoading: createMutation.isPending,
    error: createMutation.error,
  };
}

/**
 * Hook for fetching products from database
 */
export function useProducts() {
  const { data: products, isLoading, error } = trpc.products.list.useQuery();
  const { data: popularProducts } = trpc.products.popular.useQuery({ limit: 10 });
  
  return {
    products: products || [],
    popularProducts: popularProducts || [],
    isLoading,
    error,
  };
}

/**
 * Hook for fetching machines from database
 */
export function useMachines() {
  const { data: machines, isLoading, error } = trpc.machines.list.useQuery();
  
  return {
    machines: machines || [],
    isLoading,
    error,
  };
}

/**
 * Hook for validating promo codes
 */
export function usePromoCode() {
  const utils = trpc.useUtils();
  
  const validatePromo = async (code: string) => {
    const result = await utils.promo.validate.fetch({ code });
    return result;
  };
  
  return {
    validatePromo,
  };
}
