import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  addedAt: Date;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (item) => {
        const exists = get().favorites.some((f) => f.id === item.id);
        if (!exists) {
          set((state) => ({
            favorites: [
              ...state.favorites,
              { ...item, addedAt: new Date() },
            ],
          }));
        }
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }));
      },

      isFavorite: (id) => {
        return get().favorites.some((f) => f.id === id);
      },

      toggleFavorite: (item) => {
        const isFav = get().isFavorite(item.id);
        if (isFav) {
          get().removeFavorite(item.id);
        } else {
          get().addFavorite(item);
        }
      },

      clearFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: 'vendhub-favorites',
    }
  )
);
