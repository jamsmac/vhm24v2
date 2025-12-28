/**
 * VendHub TWA - Modern Home Page
 * Clean, modern design with VendHub branding
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useUserStore, formatPoints } from "@/stores/userStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCartStore } from "@/stores/cartStore";
import { useOrderHistoryStore } from "@/stores/orderHistoryStore";
import Recommendations from "@/components/Recommendations";
import { Gift, ChevronRight, Sparkles, Bell, Clock, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";

// Mock user data for demo
const mockUser = {
  firstName: "Jamshid",
  pointsBalance: 25000,
  level: "silver" as const,
};

export default function Home() {
  const { user, haptic } = useTelegram();
  const { profile, loyalty } = useUserStore();
  const { favorites } = useFavoritesStore();
  const { items: cartItems } = useCartStore();
  const { getOrderStats, getCompletedOrders } = useOrderHistoryStore();
  const [, navigate] = useLocation();
  
  const displayName = user?.first_name || profile?.firstName || mockUser.firstName;
  const points = loyalty?.pointsBalance || mockUser.pointsBalance;
  const orderStats = getOrderStats();
  const hasOrderHistory = getCompletedOrders().length > 0;

  const handleRecommendationClick = (itemId: string) => {
    haptic.selection();
    navigate('/locations');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with gradient */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-caramel/20 via-cream to-background" />
        
        <div className="relative px-4 pt-safe-top">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/images/vendhub-logo.png" 
                alt="VendHub" 
                className="w-11 h-11 rounded-xl"
              />
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">VendHub</h1>
                <p className="text-xs text-muted-foreground">Coffee & Snacks</p>
              </div>
            </div>
            
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full relative"
              onClick={() => haptic.selection()}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
          </div>

          {/* Welcome section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-6"
          >
            <p className="text-muted-foreground text-sm">{getGreeting()},</p>
            <h2 className="font-display text-2xl font-bold text-foreground">{displayName}! 👋</h2>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-2 space-y-5">
        {/* Bonus Card - Modern glassmorphism style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/profile/bonuses">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-espresso via-espresso/95 to-espresso/90 text-white p-5 rounded-2xl shadow-xl shadow-espresso/20">
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-caramel/20 rounded-full blur-xl" />
              
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/70 text-sm mb-1">Бонусный баланс</p>
                    <p className="font-display text-3xl font-bold">
                      {formatPoints(points)}
                      <span className="text-base font-normal text-white/60 ml-1">UZS</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                </div>
                
                {/* Level progress */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-caramel" />
                      <span className="text-white/80">Silver</span>
                    </div>
                    <span className="text-white/60">До Gold: 5 покупок</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-caramel to-yellow-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Quick Stats */}
        {hasOrderHistory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-3"
          >
            <Card className="p-4 text-center bg-secondary/50 border-0 rounded-2xl">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="font-display font-bold text-lg text-foreground">{orderStats.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Заказов</p>
            </Card>
            <Card className="p-4 text-center bg-secondary/50 border-0 rounded-2xl">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">₿</span>
              </div>
              <p className="font-display font-bold text-lg text-foreground">{formatPrice(orderStats.totalSpent)}</p>
              <p className="text-xs text-muted-foreground">Потрачено</p>
            </Card>
            <Card className="p-4 text-center bg-secondary/50 border-0 rounded-2xl">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <p className="font-display font-bold text-lg text-foreground">2.5</p>
              <p className="text-xs text-muted-foreground">мин среднее</p>
            </Card>
          </motion.div>
        )}

        {/* Personalized Recommendations */}
        {hasOrderHistory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Recommendations
              title="Рекомендуем для вас"
              limit={5}
              excludeIds={[]}
              showReason={true}
              variant="horizontal"
              onItemClick={handleRecommendationClick}
            />
          </motion.div>
        )}

        {/* Promo Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-caramel/90 to-caramel p-5 rounded-2xl">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20">
              <img src="/images/espresso-card.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative">
              <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium mb-2">
                Акция
              </span>
              <h3 className="font-display text-lg font-bold text-white mb-1">
                Второй кофе -50%
              </h3>
              <p className="text-white/80 text-sm mb-3">
                При заказе от 30 000 UZS
              </p>
              <Button 
                size="sm" 
                className="bg-white text-espresso hover:bg-white/90 rounded-xl"
                onClick={() => {
                  haptic.selection();
                  navigate('/locations');
                }}
              >
                Заказать
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Recent / Popular section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-foreground">Популярное</h3>
            <Link href="/locations">
              <Button variant="ghost" size="sm" className="text-muted-foreground h-8">
                Все
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'cappuccino', name: 'Капучино', price: 20000, image: '/images/cappuccino-card.png' },
              { id: 'latte', name: 'Латте', price: 22000, image: '/images/cappuccino-card.png' },
              { id: 'americano', name: 'Американо', price: 15000, image: '/images/americano-card.png' },
              { id: 'espresso', name: 'Эспрессо', price: 12000, image: '/images/espresso-card.png' },
            ].map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + index * 0.05 }}
              >
                <Card 
                  className="overflow-hidden border-0 bg-card rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    haptic.selection();
                    navigate(`/drink/${item.id}`);
                  }}
                >
                  <div className="aspect-square relative bg-secondary/50">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-foreground">{item.name}</h4>
                    <p className="text-sm font-semibold text-espresso mt-1">
                      {formatPrice(item.price)} UZS
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
