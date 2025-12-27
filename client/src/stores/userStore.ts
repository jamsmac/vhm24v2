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
