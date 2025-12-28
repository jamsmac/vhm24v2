/**
 * VendHub TWA - Pending Order Store
 * Remembers selected drink when user navigates from home to locations
 */

import { create } from 'zustand';

export interface PendingDrink {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

interface PendingOrderState {
  pendingDrink: PendingDrink | null;
  
  // Actions
  setPendingDrink: (drink: PendingDrink) => void;
  clearPendingDrink: () => void;
  hasPendingDrink: () => boolean;
}

export const usePendingOrderStore = create<PendingOrderState>((set, get) => ({
  pendingDrink: null,
  
  setPendingDrink: (drink) => {
    set({ pendingDrink: drink });
  },
  
  clearPendingDrink: () => {
    set({ pendingDrink: null });
  },
  
  hasPendingDrink: () => {
    return get().pendingDrink !== null;
  },
}));
