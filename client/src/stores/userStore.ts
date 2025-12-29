import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  telegramId: string;
  telegramUsername?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  language: 'ru' | 'uz' | 'en';
  isVerified: boolean;
}

export interface LoyaltyInfo {
  pointsBalance: number;
  lifetimePoints: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextLevelPoints: number;
  pointsToNextLevel: number;
}

export interface Order {
  id: string;
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  paymentProvider: 'click' | 'payme' | 'uzum';
  machineName: string;
  machineNumber: string;
  createdAt: string;
  paidAt?: string;
}

interface UserState {
  profile: UserProfile | null;
  loyalty: LoyaltyInfo | null;
  orders: Order[];
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  setLoyalty: (loyalty: LoyaltyInfo) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateLanguage: (language: 'ru' | 'uz' | 'en') => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      loyalty: null,
      orders: [],
      isAuthenticated: false,
      isLoading: false,
      
      setProfile: (profile: UserProfile) => set({ profile, isAuthenticated: true }),
      
      setLoyalty: (loyalty: LoyaltyInfo) => set({ loyalty }),
      
      setOrders: (orders: Order[]) => set({ orders }),
      
      addOrder: (order: Order) => set((state) => ({
        orders: [order, ...state.orders],
      })),
      
      updateLanguage: (language: 'ru' | 'uz' | 'en') => set((state) => ({
        profile: state.profile ? { ...state.profile, language } : null,
      })),
      
      logout: () => set({
        profile: null,
        loyalty: null,
        orders: [],
        isAuthenticated: false,
      }),
      
      setLoading: (isLoading: boolean) => set({ isLoading }),
    }),
    {
      name: 'vendhub-user',
    }
  )
);

// Helper to format loyalty level
export function getLoyaltyLevelName(level: LoyaltyInfo['level'], lang: 'ru' | 'uz' | 'en' = 'ru'): string {
  const names = {
    bronze: { ru: 'Бронза', uz: 'Bronza', en: 'Bronze' },
    silver: { ru: 'Серебро', uz: 'Kumush', en: 'Silver' },
    gold: { ru: 'Золото', uz: 'Oltin', en: 'Gold' },
    platinum: { ru: 'Платина', uz: 'Platina', en: 'Platinum' },
  };
  return names[level][lang];
}

// Helper to format points
export function formatPoints(points: number): string {
  return new Intl.NumberFormat('ru-RU').format(points);
}

// Loyalty level discounts (permanent discounts based on level)
export const LEVEL_DISCOUNTS: Record<LoyaltyInfo['level'], number> = {
  bronze: 0,    // 0% discount
  silver: 3,    // 3% permanent discount
  gold: 5,      // 5% permanent discount
  platinum: 10, // 10% permanent discount
};

// Get discount percentage for a level
export function getLevelDiscount(level: LoyaltyInfo['level']): number {
  return LEVEL_DISCOUNTS[level];
}

// Calculate discounted price
export function applyLevelDiscount(price: number, level: LoyaltyInfo['level']): number {
  const discount = LEVEL_DISCOUNTS[level];
  return Math.round(price * (1 - discount / 100));
}

// Get discount amount
export function getLevelDiscountAmount(price: number, level: LoyaltyInfo['level']): number {
  const discount = LEVEL_DISCOUNTS[level];
  return Math.round(price * discount / 100);
}

// Level thresholds (total spent to reach level)
export const LEVEL_THRESHOLDS: Record<LoyaltyInfo['level'], number> = {
  bronze: 0,
  silver: 100000,    // 100k UZS spent
  gold: 500000,      // 500k UZS spent
  platinum: 1000000, // 1M UZS spent
};

// Get next level info
export function getNextLevelInfo(currentLevel: LoyaltyInfo['level'], totalSpent: number): {
  nextLevel: LoyaltyInfo['level'] | null;
  amountToNext: number;
  nextDiscount: number;
} {
  const levels: LoyaltyInfo['level'][] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = levels.indexOf(currentLevel);
  
  if (currentIndex >= levels.length - 1) {
    return { nextLevel: null, amountToNext: 0, nextDiscount: 0 };
  }
  
  const nextLevel = levels[currentIndex + 1];
  const threshold = LEVEL_THRESHOLDS[nextLevel];
  
  return {
    nextLevel,
    amountToNext: Math.max(0, threshold - totalSpent),
    nextDiscount: LEVEL_DISCOUNTS[nextLevel]
  };
}
