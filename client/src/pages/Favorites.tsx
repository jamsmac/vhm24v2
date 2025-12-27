/**
 * Favorites Page - VendHub TWA
 * Design: Warm Brew - Cozy coffee minimalism
 * Shows user's favorite drinks with quick reorder functionality
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCartStore } from '@/stores/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Plus, ShoppingCart, Trash2, Coffee } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';

export default function Favorites() {
  const [, navigate] = useLocation();
  const { favorites, removeFavorite, clearFavorites } = useFavoritesStore();
  const { addItem } = useCartStore();

  const handleAddToCart = (item: typeof favorites[0]) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      isAvailable: true,
    });
    toast.success(`${item.name} добавлен в корзину`);
  };

  const handleAddAllToCart = () => {
    favorites.forEach((item) => {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category,
        isAvailable: true,
      });
    });
    toast.success(`${favorites.length} напитков добавлено в корзину`);
  };

  const handleRemoveFavorite = (id: string, name: string) => {
    removeFavorite(id);
    toast.success(`${name} удалён из избранного`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' UZS';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-espresso">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-display text-xl font-semibold text-espresso">
              Избранное
            </h1>
          </div>
          {favorites.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearFavorites();
                toast.success('Избранное очищено');
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Очистить
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-caramel" />
            </div>
            <h2 className="font-display text-xl font-semibold text-espresso mb-2">
              Нет избранных напитков
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Добавляйте любимые напитки в избранное, чтобы быстро заказывать их снова
            </p>
            <Link href="/locations">
              <Button className="bg-espresso hover:bg-espresso/90">
                <Coffee className="w-4 h-4 mr-2" />
                Перейти к меню
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Quick Add All Button */}
            <Card className="p-4 bg-gradient-to-r from-caramel/10 to-cream border-caramel/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-espresso">
                    {favorites.length} {favorites.length === 1 ? 'напиток' : 'напитков'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Добавить все в корзину одним нажатием
                  </p>
                </div>
                <Button
                  onClick={handleAddAllToCart}
                  className="bg-espresso hover:bg-espresso/90"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Добавить все
                </Button>
              </div>
            </Card>

            {/* Favorites List */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {favorites.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="flex">
                        {/* Image */}
                        <div className="w-24 h-24 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between">
                              <h3 className="font-display font-semibold text-espresso">
                                {item.name}
                              </h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -mt-1 -mr-1 text-red-400 hover:text-red-500 hover:bg-red-50"
                                onClick={() => handleRemoveFavorite(item.id, item.name)}
                              >
                                <Heart className="w-4 h-4 fill-current" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="font-semibold text-espresso">
                              {formatPrice(item.price)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(item)}
                              className="h-8 bg-espresso hover:bg-espresso/90"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              В корзину
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
