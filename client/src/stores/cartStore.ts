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
  
  // Actions
  setMachine: (machine: Machine) => void;
  clearMachine: () => void;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  
  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      machine: null,
      promoCode: null,
      promoDiscount: 0,
      
      setMachine: (machine: Machine) => set({ machine, items: [], promoCode: null, promoDiscount: 0 }),
      
      clearMachine: () => set({ machine: null, items: [], promoCode: null, promoDiscount: 0 }),
      
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
      
      clearCart: () => set({ items: [], promoCode: null, promoDiscount: 0 }),
      
      applyPromo: (code: string, discount: number) => set({ promoCode: code, promoDiscount: discount }),
      
      removePromo: () => set({ promoCode: null, promoDiscount: 0 }),
      
      getTotalItems: () => get().items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
      
      getSubtotal: () => get().items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0),
      
      getDiscount: () => {
        const subtotal = get().getSubtotal();
        return Math.round(subtotal * (get().promoDiscount / 100));
      },
      
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        return subtotal - discount;
      },
    }),
    {
      name: 'vendhub-cart',
    }
  )
);
