/**
 * VendHub TWA - Recommendations Component
 * "Warm Brew" Design System
 * 
 * Displays personalized drink recommendations based on order history
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { generateRecommendations, Recommendation } from '@/services/recommendationEngine';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Heart, Clock, TrendingUp, History } from 'lucide-react';
import { toast } from 'sonner';
import { useMemo } from 'react';

interface RecommendationsProps {
  title?: string;
  limit?: number;
  excludeIds?: string[];
  showReason?: boolean;
  variant?: 'horizontal' | 'grid';
  onItemClick?: (itemId: string) => void;
}

const reasonIcons: { [key: string]: React.ReactNode } = {
  history: <History className="w-3 h-3" />,
  favorite: <Heart className="w-3 h-3" />,
  popular: <TrendingUp className="w-3 h-3" />,
  time: <Clock className="w-3 h-3" />,
  similar: <Sparkles className="w-3 h-3" />,
  new: <Sparkles className="w-3 h-3" />,
};

export default function Recommendations({
  title = 'Рекомендации для вас',
  limit = 5,
  excludeIds = [],
  showReason = true,
  variant = 'horizontal',
  onItemClick,
}: RecommendationsProps) {
  const { addItem, machine } = useCartStore();
  const { favorites, isFavorite, toggleFavorite } = useFavoritesStore();
  const { getOrderStats } = useOrderHistoryStore();

  const recommendations = useMemo(() => {
    const stats = getOrderStats();
    return generateRecommendations(stats, favorites, excludeIds, limit);
  }, [getOrderStats, favorites, excludeIds, limit]);

  const handleAddToCart = (rec: Recommendation) => {
    if (!machine) {
      toast.error('Сначала выберите автомат');
      return;
    }
    addItem({
      id: rec.item.id,
      name: rec.item.name,
      price: rec.item.price,
      image: rec.item.image,
      category: rec.item.category,
      isAvailable: rec.item.isAvailable,
    });
    toast.success(`${rec.item.name} добавлен в корзину`);
  };

  const handleToggleFavorite = (rec: Recommendation) => {
    toggleFavorite({
      id: rec.item.id,
      name: rec.item.name,
      description: rec.item.description || '',
      price: rec.item.price,
      image: rec.item.image || '',
      category: rec.item.category,
    });
    
    if (isFavorite(rec.item.id)) {
      toast.success(`${rec.item.name} удалён из избранного`);
    } else {
      toast.success(`${rec.item.name} добавлен в избранное`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  if (recommendations.length === 0) {
    return null;
  }

  if (variant === 'horizontal') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-caramel" />
          <h3 className="font-display font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0"
            >
              <Card 
                className="coffee-card w-36 p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onItemClick?.(rec.item.id)}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2">
                  <img
                    src={rec.item.image}
                    alt={rec.item.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(rec);
                    }}
                    className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isFavorite(rec.item.id)
                        ? 'bg-red-50 text-red-500'
                        : 'bg-white/80 text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isFavorite(rec.item.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <h4 className="font-medium text-sm text-foreground truncate">{rec.item.name}</h4>
                {showReason && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-caramel">{reasonIcons[rec.reasonType]}</span>
                    <span className="text-xs text-muted-foreground truncate">{rec.reason}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-espresso">
                    {formatPrice(rec.item.price)}
                  </span>
                  <Button
                    size="icon"
                    className="w-6 h-6 rounded-full bg-espresso hover:bg-espresso/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(rec);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-caramel" />
        <h3 className="font-display font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="coffee-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onItemClick?.(rec.item.id)}
            >
              <div className="relative aspect-square -mx-4 -mt-4 mb-3">
                <img
                  src={rec.item.image}
                  alt={rec.item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(rec);
                  }}
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isFavorite(rec.item.id)
                      ? 'bg-red-50 text-red-500'
                      : 'bg-white/80 text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(rec.item.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm truncate">{rec.item.name}</h4>
                {showReason && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-caramel">{reasonIcons[rec.reasonType]}</span>
                    <span className="text-xs text-muted-foreground truncate">{rec.reason}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="price-tag text-sm">{formatPrice(rec.item.price)} UZS</span>
                  <Button
                    size="icon"
                    className="w-8 h-8 rounded-full bg-espresso hover:bg-espresso/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(rec);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
