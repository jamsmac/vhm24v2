/**
 * VendHub TWA - Notifications Store
 * Manages in-app notifications and subscription settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 
  | 'promo' 
  | 'favorite_promo' 
  | 'order_status' 
  | 'bonus' 
  | 'new_product' 
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  image?: string;
  data?: Record<string, unknown>;
}

export interface NotificationSettings {
  enabled: boolean;
  promoNotifications: boolean;
  favoritePromoNotifications: boolean;
  orderStatusNotifications: boolean;
  bonusNotifications: boolean;
  newProductNotifications: boolean;
  sound: boolean;
  vibration: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  settings: NotificationSettings;
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Helpers
  getUnreadCount: () => number;
  getNotificationsByType: (type: NotificationType) => Notification[];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Default settings
const defaultSettings: NotificationSettings = {
  enabled: true,
  promoNotifications: true,
  favoritePromoNotifications: true,
  orderStatusNotifications: true,
  bonusNotifications: true,
  newProductNotifications: true,
  sound: true,
  vibration: true,
};

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'favorite_promo',
    title: '🎉 Скидка на ваш любимый напиток!',
    message: 'Капучино сейчас со скидкой 20%! Используйте промокод COFFEE20',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    read: false,
    actionUrl: '/promotions',
  },
  {
    id: '2',
    type: 'bonus',
    title: '⭐ Начислены бонусы',
    message: 'Вам начислено 500 бонусов за последний заказ!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    actionUrl: '/profile/bonuses',
  },
  {
    id: '3',
    type: 'promo',
    title: '☕ Happy Hour начался!',
    message: 'С 14:00 до 16:00 скидка 30% на все холодные напитки',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
    actionUrl: '/promotions',
  },
  {
    id: '4',
    type: 'new_product',
    title: '✨ Новинка: Раф Лаванда',
    message: 'Попробуйте наш новый фирменный напиток со вкусом лаванды!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    actionUrl: '/drink/raf_lavender',
  },
  {
    id: '5',
    type: 'order_status',
    title: '✅ Заказ готов!',
    message: 'Ваш заказ #1234 готов к выдаче в автомате KIUT',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
    actionUrl: '/profile/history',
  },
];

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: mockNotifications,
      settings: defaultSettings,
      unreadCount: mockNotifications.filter(n => !n.read).length,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          timestamp: new Date(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (!notification || notification.read) return state;
          
          return {
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          const wasUnread = notification && !notification.read;
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      getUnreadCount: () => get().unreadCount,

      getNotificationsByType: (type) => {
        return get().notifications.filter(n => n.type === type);
      },
    }),
    {
      name: 'vendhub-notifications',
      partialize: (state) => ({
        settings: state.settings,
        // Don't persist notifications - they should come from server in real app
      }),
    }
  )
);

// Helper to format relative time
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дн назад`;
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

// Get notification type label
export const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case 'promo': return 'Акция';
    case 'favorite_promo': return 'Избранное';
    case 'order_status': return 'Заказ';
    case 'bonus': return 'Бонусы';
    case 'new_product': return 'Новинка';
    case 'system': return 'Система';
    default: return 'Уведомление';
  }
};

// Get notification type color
export const getNotificationTypeColor = (type: NotificationType): string => {
  switch (type) {
    case 'promo': return 'bg-red-100 text-red-600';
    case 'favorite_promo': return 'bg-pink-100 text-pink-600';
    case 'order_status': return 'bg-green-100 text-green-600';
    case 'bonus': return 'bg-amber-100 text-amber-600';
    case 'new_product': return 'bg-purple-100 text-purple-600';
    case 'system': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};
