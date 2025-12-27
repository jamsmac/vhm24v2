import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  machineId: string;
  machineName: string;
  locationName: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  bonusEarned?: number;
}

interface OrderHistoryState {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => string;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getRecentOrders: (limit?: number) => Order[];
  getCompletedOrders: () => Order[];
  getOrderStats: () => OrderStats;
  clearHistory: () => void;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  favoriteCategory: string | null;
  mostOrderedItems: { id: string; name: string; count: number; image?: string; category: string; price: number }[];
  recentCategories: string[];
  averageOrderValue: number;
  orderFrequency: { [key: string]: number }; // category -> count
}

export const useOrderHistoryStore = create<OrderHistoryState>()(
  persist(
    (set, get) => ({
      orders: [
        // Mock data for demo
        {
          id: 'order-1',
          items: [
            { id: '3', name: 'Капучино', price: 20000, quantity: 2, image: '/images/cappuccino-card.png', category: 'coffee' },
            { id: '2', name: 'Американо', price: 15000, quantity: 1, image: '/images/americano-card.png', category: 'coffee' },
          ],
          total: 49500,
          machineId: 'M-001',
          machineName: 'KIUT Корпус А',
          locationName: 'KIUT University',
          status: 'completed',
          createdAt: new Date('2024-12-26T10:30:00'),
          completedAt: new Date('2024-12-26T10:35:00'),
          bonusEarned: 495,
        },
        {
          id: 'order-2',
          items: [
            { id: '4', name: 'Латте', price: 22000, quantity: 1, image: '/images/cappuccino-card.png', category: 'coffee' },
          ],
          total: 22000,
          machineId: 'M-002',
          machineName: 'IT Park Ташкент',
          locationName: 'IT Park',
          status: 'completed',
          createdAt: new Date('2024-12-25T14:15:00'),
          completedAt: new Date('2024-12-25T14:20:00'),
          bonusEarned: 220,
        },
        {
          id: 'order-3',
          items: [
            { id: '1', name: 'Эспрессо', price: 12000, quantity: 3, image: '/images/espresso-card.png', category: 'coffee' },
          ],
          total: 36000,
          machineId: 'M-003',
          machineName: 'Hilton',
          locationName: 'Hilton Hotel',
          status: 'cancelled',
          createdAt: new Date('2024-12-24T09:00:00'),
        },
        {
          id: 'order-4',
          items: [
            { id: '3', name: 'Капучино', price: 20000, quantity: 1, image: '/images/cappuccino-card.png', category: 'coffee' },
            { id: '8', name: 'Горячий шоколад', price: 18000, quantity: 1, image: '/images/cappuccino-card.png', category: 'other' },
          ],
          total: 38000,
          machineId: 'M-001',
          machineName: 'KIUT Корпус А',
          locationName: 'KIUT University',
          status: 'completed',
          createdAt: new Date('2024-12-23T16:45:00'),
          completedAt: new Date('2024-12-23T16:50:00'),
          bonusEarned: 380,
        },
        {
          id: 'order-5',
          items: [
            { id: '6', name: 'Чай зелёный', price: 10000, quantity: 2, image: '/images/americano-card.png', category: 'tea' },
          ],
          total: 20000,
          machineId: 'M-001',
          machineName: 'KIUT Корпус А',
          locationName: 'KIUT University',
          status: 'completed',
          createdAt: new Date('2024-12-22T11:00:00'),
          completedAt: new Date('2024-12-22T11:05:00'),
          bonusEarned: 200,
        },
      ],

      addOrder: (orderData) => {
        const orderId = `order-${Date.now()}`;
        const newOrder: Order = {
          ...orderData,
          id: orderId,
          createdAt: new Date(),
        };
        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));
        return orderId;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                  completedAt: status === 'completed' ? new Date() : order.completedAt,
                }
              : order
          ),
        }));
      },

      getOrderById: (orderId) => {
        return get().orders.find((order) => order.id === orderId);
      },

      getRecentOrders: (limit = 10) => {
        return get().orders.slice(0, limit);
      },

      getCompletedOrders: () => {
        return get().orders.filter((order) => order.status === 'completed');
      },

      getOrderStats: () => {
        const completedOrders = get().getCompletedOrders();
        
        // Calculate total orders and spent
        const totalOrders = completedOrders.length;
        const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0);
        const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

        // Count items ordered
        const itemCounts: { [key: string]: { count: number; name: string; image?: string; category: string; price: number } } = {};
        const categoryCounts: { [key: string]: number } = {};

        completedOrders.forEach((order) => {
          order.items.forEach((item) => {
            // Count items
            if (!itemCounts[item.id]) {
              itemCounts[item.id] = { count: 0, name: item.name, image: item.image, category: item.category, price: item.price };
            }
            itemCounts[item.id].count += item.quantity;

            // Count categories
            if (!categoryCounts[item.category]) {
              categoryCounts[item.category] = 0;
            }
            categoryCounts[item.category] += item.quantity;
          });
        });

        // Get most ordered items
        const mostOrderedItems = Object.entries(itemCounts)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Get favorite category
        const favoriteCategory = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        // Get recent categories from last 5 orders
        const recentCategoriesSet = new Set(
          completedOrders
            .slice(0, 5)
            .flatMap((order) => order.items.map((item) => item.category))
        );
        const recentCategories = Array.from(recentCategoriesSet);

        return {
          totalOrders,
          totalSpent,
          favoriteCategory,
          mostOrderedItems,
          recentCategories,
          averageOrderValue,
          orderFrequency: categoryCounts,
        };
      },

      clearHistory: () => {
        set({ orders: [] });
      },
    }),
    {
      name: 'vendhub-order-history',
    }
  )
);
