/**
 * VendHub TWA - Home Page
 * "Warm Brew" Design System
 * 
 * Features:
 * - QR Scanner area (simulated for web)
 * - Location selection
 * - User profile quick access
 * - Bonus balance display
 * - Quick reorder from favorites
 * - Personalized recommendations based on order history
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useUserStore, formatPoints } from "@/stores/userStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCartStore } from "@/stores/cartStore";
import { useOrderHistoryStore } from "@/stores/orderHistoryStore";
import Recommendations from "@/components/Recommendations";
import { Coffee, MapPin, QrCode, User, Gift, ChevronRight, Sparkles, Heart, Plus, History, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Mock user data for demo
const mockUser = {
  firstName: "Jamshid",
  pointsBalance: 25000,
  level: "silver" as const,
};

export default function Home() {
  const { user, haptic, isTelegram } = useTelegram();
  const { profile, loyalty } = useUserStore();
  const { favorites } = useFavoritesStore();
  const { addItem, machine } = useCartStore();
  const { getOrderStats, getCompletedOrders } = useOrderHistoryStore();
  const [, navigate] = useLocation();
  
  const displayName = user?.first_name || profile?.firstName || mockUser.firstName;
  const points = loyalty?.pointsBalance || mockUser.pointsBalance;
  const orderStats = getOrderStats();
  const hasOrderHistory = getCompletedOrders().length > 0;

  const handleQrScan = () => {
    haptic.impact('medium');
    // In real app, this would open camera or use Telegram's QR scanner
  };

  const handleQuickAdd = (item: typeof favorites[0]) => {
    haptic.impact('light');
    if (!machine) {
      toast.error('Сначала выберите автомат');
      return;
    }
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

  const handleRecommendationClick = (itemId: string) => {
    haptic.selection();
    // Navigate to menu with the item highlighted or show item details
    navigate('/locations');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  // Get favorite IDs to exclude from recommendations
  const favoriteIds = favorites.map(f => f.id);

  return (
    <div className="min-h-screen bg-background coffee-pattern safe-top safe-bottom">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5D4037] to-[#3E2723] flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">VendHub</h1>
              <p className="text-xs text-muted-foreground">Coffee & More</p>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="coffee-card overflow-hidden">
            <div className="relative">
              <img 
                src="/images/hero-coffee.png" 
                alt="Coffee" 
                className="w-full h-32 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white/80 text-sm">Добро пожаловать,</p>
                <h2 className="font-display text-xl font-bold text-white">{displayName}!</h2>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Personalized Recommendations Section */}
        {hasOrderHistory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Recommendations
              title="Рекомендации для вас"
              limit={5}
              excludeIds={[]}
              showReason={true}
              variant="horizontal"
              onItemClick={handleRecommendationClick}
            />
          </motion.div>
        )}

        {/* Order Stats Summary (if has history) */}
        {hasOrderHistory && orderStats.totalOrders > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="coffee-card bg-gradient-to-r from-[#FDF8F3] to-[#F5EDE4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-caramel/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-caramel" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Ваша статистика</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div>
                      <span className="font-display font-bold text-foreground">{orderStats.totalOrders}</span>
                      <span className="text-xs text-muted-foreground ml-1">заказов</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div>
                      <span className="font-display font-bold text-foreground">
                        {formatPrice(orderStats.totalSpent)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">UZS</span>
                    </div>
                    {orderStats.favoriteCategory && (
                      <>
                        <div className="w-px h-4 bg-border" />
                        <div>
                          <span className="text-xs text-muted-foreground">Любимое: </span>
                          <span className="text-xs font-medium text-foreground capitalize">
                            {orderStats.favoriteCategory === 'coffee' ? 'Кофе' : 
                             orderStats.favoriteCategory === 'tea' ? 'Чай' : 'Другое'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Quick Favorites Section */}
        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: hasOrderHistory ? 0.15 : 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                <h3 className="font-display font-semibold text-foreground">Быстрый заказ</h3>
              </div>
              <Link href="/profile/favorites">
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8">
                  Все
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {favorites.slice(0, 5).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0"
                >
                  <Card className="coffee-card w-32 p-3">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-medium text-sm text-foreground truncate">{item.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatPrice(item.price)}
                      </span>
                      <Button
                        size="icon"
                        className="w-6 h-6 rounded-full bg-[#5D4037] hover:bg-[#4E342E]"
                        onClick={() => handleQuickAdd(item)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* QR Scanner Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: hasOrderHistory ? 0.2 : (favorites.length > 0 ? 0.15 : 0.1) }}
        >
          <Card className="coffee-card">
            <div className="text-center py-6">
              <div 
                onClick={handleQrScan}
                className="mx-auto w-48 h-48 rounded-2xl border-2 border-dashed border-[#D4A574] bg-[#FDF8F3] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#F5EDE4] transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8956C] flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Сканировать QR</p>
                  <p className="text-sm text-muted-foreground">Наведите на автомат</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">или</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              <Link href="/locations">
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl h-12 border-2 hover:bg-secondary"
                  onClick={() => haptic.selection()}
                >
                  <MapPin className="w-5 h-5 mr-2 text-[#5D4037]" />
                  <span>Выбрать из списка</span>
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Bonus Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: hasOrderHistory ? 0.25 : (favorites.length > 0 ? 0.25 : 0.2) }}
        >
          <Link href="/profile/bonuses">
            <Card className="coffee-card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8956C] flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Бонусный баланс</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {formatPoints(points)} <span className="text-sm font-sans font-normal text-muted-foreground">UZS</span>
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              
              {/* Level indicator */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C0C0C0]" />
                    <span className="text-muted-foreground">Уровень:</span>
                    <span className="font-medium text-foreground">Silver</span>
                  </div>
                  <span className="text-muted-foreground">До Gold: 5 покупок</span>
                </div>
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#C0C0C0] to-[#FFD700] rounded-full transition-all duration-500"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: hasOrderHistory ? 0.3 : (favorites.length > 0 ? 0.35 : 0.3) }}
          className="grid grid-cols-2 gap-3"
        >
          <Link href="/profile/favorites">
            <Card className="coffee-card hover:shadow-md transition-shadow cursor-pointer p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-sm font-medium">Избранное</span>
                {favorites.length > 0 && (
                  <span className="text-xs text-muted-foreground">{favorites.length} напитков</span>
                )}
              </div>
            </Card>
          </Link>
          
          <Link href="/profile/history">
            <Card className="coffee-card hover:shadow-md transition-shadow cursor-pointer p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <History className="w-5 h-5 text-[#5D4037]" />
                </div>
                <span className="text-sm font-medium">История заказов</span>
                {orderStats.totalOrders > 0 && (
                  <span className="text-xs text-muted-foreground">{orderStats.totalOrders} заказов</span>
                )}
              </div>
            </Card>
          </Link>
        </motion.div>
      </main>

      {/* Bottom safe area spacer */}
      <div className="h-8" />
    </div>
  );
}
