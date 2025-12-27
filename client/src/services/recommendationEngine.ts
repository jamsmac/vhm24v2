/**
 * VendHub TWA - Recommendation Engine
 * 
 * Generates personalized drink recommendations based on:
 * - Order history (most ordered items)
 * - Category preferences
 * - Time of day
 * - Seasonal preferences
 * - Similar items to favorites
 */

import { OrderStats } from '@/stores/orderHistoryStore';
import { FavoriteItem } from '@/stores/favoritesStore';

export interface MenuItem {
  id: string;
  name: string;
  nameUz?: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  isAvailable: boolean;
  tags?: string[];
}

export interface Recommendation {
  item: MenuItem;
  reason: string;
  reasonType: 'history' | 'favorite' | 'popular' | 'time' | 'similar' | 'new';
  score: number;
}

// Full menu data (would come from API in production)
const fullMenu: MenuItem[] = [
  {
    id: '1',
    name: 'Эспрессо',
    nameUz: 'Espresso',
    description: 'Классический итальянский эспрессо',
    price: 12000,
    image: '/images/espresso-card.png',
    category: 'coffee',
    isAvailable: true,
    tags: ['classic', 'strong', 'morning'],
  },
  {
    id: '2',
    name: 'Американо',
    nameUz: 'Amerikano',
    description: 'Эспрессо с горячей водой',
    price: 15000,
    image: '/images/americano-card.png',
    category: 'coffee',
    isAvailable: true,
    tags: ['classic', 'light', 'morning', 'afternoon'],
  },
  {
    id: '3',
    name: 'Капучино',
    nameUz: 'Kapuchino',
    description: 'Эспрессо с молочной пенкой',
    price: 20000,
    image: '/images/cappuccino-card.png',
    category: 'coffee',
    isAvailable: true,
    tags: ['milk', 'popular', 'morning', 'afternoon'],
  },
  {
    id: '4',
    name: 'Латте',
    nameUz: 'Latte',
    description: 'Нежный кофе с молоком',
    price: 22000,
    image: '/images/cappuccino-card.png',
    category: 'coffee',
    isAvailable: true,
    tags: ['milk', 'soft', 'popular', 'afternoon'],
  },
  {
    id: '5',
    name: 'Мокко',
    nameUz: 'Mokko',
    description: 'Кофе с шоколадом и молоком',
    price: 25000,
    image: '/images/cappuccino-card.png',
    category: 'coffee',
    isAvailable: false,
    tags: ['chocolate', 'sweet', 'dessert'],
  },
  {
    id: '6',
    name: 'Чай зелёный',
    nameUz: 'Yashil choy',
    description: 'Классический зелёный чай',
    price: 10000,
    image: '/images/americano-card.png',
    category: 'tea',
    isAvailable: true,
    tags: ['healthy', 'light', 'afternoon'],
  },
  {
    id: '7',
    name: 'Чай чёрный',
    nameUz: 'Qora choy',
    description: 'Крепкий чёрный чай',
    price: 10000,
    image: '/images/americano-card.png',
    category: 'tea',
    isAvailable: true,
    tags: ['classic', 'strong', 'morning', 'afternoon'],
  },
  {
    id: '8',
    name: 'Горячий шоколад',
    nameUz: 'Issiq shokolad',
    description: 'Насыщенный шоколадный напиток',
    price: 18000,
    image: '/images/cappuccino-card.png',
    category: 'other',
    isAvailable: true,
    tags: ['chocolate', 'sweet', 'dessert', 'evening'],
  },
];

/**
 * Get time-based tag based on current hour
 */
function getTimeTag(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate similarity score between two items based on tags and category
 */
function calculateSimilarity(item1: MenuItem, item2: MenuItem): number {
  let score = 0;
  
  // Same category bonus
  if (item1.category === item2.category) {
    score += 0.5;
  }
  
  // Tag overlap
  const tags1 = item1.tags || [];
  const tags2 = item2.tags || [];
  const commonTags = tags1.filter(tag => tags2.includes(tag));
  score += commonTags.length * 0.2;
  
  return Math.min(score, 1);
}

/**
 * Generate personalized recommendations
 */
export function generateRecommendations(
  orderStats: OrderStats,
  favorites: FavoriteItem[],
  excludeIds: string[] = [],
  limit: number = 5
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const timeTag = getTimeTag();
  const availableMenu = fullMenu.filter(item => item.isAvailable && !excludeIds.includes(item.id));
  
  // 1. Recommendations based on order history (most ordered)
  orderStats.mostOrderedItems.forEach((orderedItem, index) => {
    const menuItem = availableMenu.find(m => m.id === orderedItem.id);
    if (menuItem) {
      recommendations.push({
        item: menuItem,
        reason: `Вы заказывали ${orderedItem.count} раз`,
        reasonType: 'history',
        score: 1 - (index * 0.1), // Decrease score for less ordered items
      });
    }
  });

  // 2. Recommendations based on favorite category
  if (orderStats.favoriteCategory) {
    const categoryItems = availableMenu.filter(
      item => item.category === orderStats.favoriteCategory && 
              !recommendations.some(r => r.item.id === item.id)
    );
    
    categoryItems.forEach((item, index) => {
      if (index < 2) { // Limit to 2 items per category
        recommendations.push({
          item,
          reason: `Из вашей любимой категории`,
          reasonType: 'similar',
          score: 0.7 - (index * 0.1),
        });
      }
    });
  }

  // 3. Time-based recommendations
  const timeBasedItems = availableMenu.filter(
    item => item.tags?.includes(timeTag) && 
            !recommendations.some(r => r.item.id === item.id)
  );
  
  timeBasedItems.slice(0, 2).forEach((item, index) => {
    const timeLabels: { [key: string]: string } = {
      morning: 'Отлично для утра',
      afternoon: 'Идеально для дня',
      evening: 'Прекрасно для вечера',
      night: 'Для ночных посиделок',
    };
    
    recommendations.push({
      item,
      reason: timeLabels[timeTag],
      reasonType: 'time',
      score: 0.6 - (index * 0.1),
    });
  });

  // 4. Similar to favorites
  favorites.forEach((fav) => {
    const favMenuItem = fullMenu.find(m => m.id === fav.id);
    if (!favMenuItem) return;
    
    availableMenu.forEach((item) => {
      if (item.id === fav.id || recommendations.some(r => r.item.id === item.id)) return;
      
      const similarity = calculateSimilarity(favMenuItem, item);
      if (similarity > 0.5) {
        recommendations.push({
          item,
          reason: `Похоже на ${fav.name}`,
          reasonType: 'similar',
          score: similarity * 0.5,
        });
      }
    });
  });

  // 5. Popular items (fallback)
  const popularItems = availableMenu.filter(
    item => item.tags?.includes('popular') && 
            !recommendations.some(r => r.item.id === item.id)
  );
  
  popularItems.forEach((item, index) => {
    recommendations.push({
      item,
      reason: 'Популярный выбор',
      reasonType: 'popular',
      score: 0.4 - (index * 0.1),
    });
  });

  // Sort by score and deduplicate
  const uniqueRecommendations = recommendations.reduce((acc, rec) => {
    const existing = acc.find(r => r.item.id === rec.item.id);
    if (!existing || existing.score < rec.score) {
      return [...acc.filter(r => r.item.id !== rec.item.id), rec];
    }
    return acc;
  }, [] as Recommendation[]);

  return uniqueRecommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get "You might also like" recommendations based on current cart
 */
export function getCartRecommendations(
  cartItemIds: string[],
  limit: number = 3
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const availableMenu = fullMenu.filter(item => item.isAvailable && !cartItemIds.includes(item.id));
  
  cartItemIds.forEach((cartItemId) => {
    const cartItem = fullMenu.find(m => m.id === cartItemId);
    if (!cartItem) return;
    
    availableMenu.forEach((item) => {
      if (recommendations.some(r => r.item.id === item.id)) return;
      
      const similarity = calculateSimilarity(cartItem, item);
      if (similarity > 0.3) {
        recommendations.push({
          item,
          reason: `Отлично сочетается с ${cartItem.name}`,
          reasonType: 'similar',
          score: similarity,
        });
      }
    });
  });

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get menu items by IDs
 */
export function getMenuItems(): MenuItem[] {
  return fullMenu;
}

/**
 * Get single menu item by ID
 */
export function getMenuItemById(id: string): MenuItem | undefined {
  return fullMenu.find(item => item.id === id);
}
