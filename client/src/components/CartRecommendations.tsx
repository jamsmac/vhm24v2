/**
 * VendHub TWA - Cart Recommendations Component
 * "Warm Brew" Design System
 * 
 * Displays "You might also like" recommendations based on current cart items
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { getCartRecommendations, Recommendation } from '@/services/recommendationEngine';
import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useMemo } from 'react';

interface CartRecommendationsProps {
  limit?: number;
}

export default function CartRecommendations({ limit = 3 }: CartRecommendationsProps) {
  const { items, addItem, machine } = useCartStore();

  const cartItemIds = useMemo(() => items.map(item => item.id), [items]);
  
  const recommendations = useMemo(() => {
    if (cartItemIds.length === 0) return [];
    return getCartRecommendations(cartItemIds, limit);
  }, [cartItemIds, limit]);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="coffee-card">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-caramel" />
        <h2 className="font-semibold text-foreground">Вам также понравится</h2>
      </div>
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <img
              src={rec.item.image}
              alt={rec.item.name}
              className="w-14 h-14 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground text-sm truncate">{rec.item.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{rec.reason}</p>
              <p className="text-sm font-semibold text-espresso mt-0.5">
                {formatPrice(rec.item.price)} UZS
              </p>
            </div>
            <Button
              size="icon"
              className="w-9 h-9 rounded-full bg-espresso hover:bg-espresso/90 flex-shrink-0"
              onClick={() => handleAddToCart(rec)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
