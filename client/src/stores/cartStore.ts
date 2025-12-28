import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MenuItem {
  id: string;
  name: string;
  nameUz?: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  isAvailable: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Machine {
  id: string;
  machineNumber: string;
  name: string;
  locationName: string;
  address?: string;
  isAvailable: boolean;
}

interface CartState {
  items: CartItem[];
  machine: Machine | null;
  promoCode: string | null;
  promoDiscount: number;
  pointsToUse: number;
  
  // Actions
  setMachine: (machine: Machine) => void;
  clearMachine: () => void;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  setPointsToUse: (points: number) => void;
  
  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getPointsDiscount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      machine: null,
      promoCode: null,
      promoDiscount: 0,
      pointsToUse: 0,
      
      setMachine: (machine: Machine) => set({ machine, items: [], promoCode: null, promoDiscount: 0, pointsToUse: 0 }),
      
      clearMachine: () => set({ machine: null, items: [], promoCode: null, promoDiscount: 0, pointsToUse: 0 }),
      
      addItem: (item: MenuItem) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id);
        if (existingItem) {
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),
      
      removeItem: (itemId: string) => set((state) => ({
        items: state.items.filter((i) => i.id !== itemId),
      })),
      
      updateQuantity: (itemId: string, quantity: number) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter((i) => i.id !== itemId) };
        }
        return {
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        };
      }),
      
      clearCart: () => set({ items: [], promoCode: null, promoDiscount: 0, pointsToUse: 0 }),
      
      applyPromo: (code: string, discount: number) => set({ promoCode: code, promoDiscount: discount }),
      
      removePromo: () => set({ promoCode: null, promoDiscount: 0 }),
      
      setPointsToUse: (points: number) => set({ pointsToUse: Math.max(0, points) }),
      
      getTotalItems: () => get().items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
      
      getSubtotal: () => get().items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0),
      
      getDiscount: () => {
        const subtotal = get().getSubtotal();
        return Math.round(subtotal * (get().promoDiscount / 100));
      },
      
      getPointsDiscount: () => {
        // Points discount is 1:1 (1 point = 1 sum)
        return get().pointsToUse;
      },
      
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const pointsDiscount = get().getPointsDiscount();
        // Ensure total doesn't go below 0
        return Math.max(0, subtotal - discount - pointsDiscount);
      },
    }),
    {
      name: 'vendhub-cart',
    }
  )
);
