/**
 * VendHub TWA - Modern Home Page
 * Clean, modern design with VendHub branding
 * Quick access to catalog and locations at the top
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useUserStore, formatPoints } from "@/stores/userStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCartStore } from "@/stores/cartStore";
import { useOrderHistoryStore } from "@/stores/orderHistoryStore";
import Recommendations from "@/components/Recommendations";
import { Gift, ChevronRight, Sparkles, Bell, Clock, TrendingUp, Coffee, MapPin, QrCode, Percent } from "lucide-react";
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
    navigate(`/drink/${itemId}`);
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
            className="pb-4"
          >
            <p className="text-muted-foreground text-sm">{getGreeting()},</p>
            <h2 className="font-display text-2xl font-bold text-foreground">{displayName}! 👋</h2>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 space-y-4">
        
        {/* Quick Actions - Prominent buttons for main navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Catalog Button */}
          <Card 
            className="p-4 border-2 border-espresso/20 bg-gradient-to-br from-espresso/5 to-espresso/10 rounded-2xl cursor-pointer hover:border-espresso/40 hover:shadow-lg transition-all active:scale-[0.98]"
            onClick={() => {
              haptic.selection();
              navigate('/menu/1');
            }}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-espresso flex items-center justify-center shadow-lg shadow-espresso/30">
                <Coffee className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">Каталог</h3>
                <p className="text-xs text-muted-foreground">Все напитки</p>
              </div>
            </div>
          </Card>

          {/* Locations Button */}
          <Card 
            className="p-4 border-2 border-caramel/20 bg-gradient-to-br from-caramel/5 to-caramel/10 rounded-2xl cursor-pointer hover:border-caramel/40 hover:shadow-lg transition-all active:scale-[0.98]"
            onClick={() => {
              haptic.selection();
              navigate('/locations');
            }}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-caramel flex items-center justify-center shadow-lg shadow-caramel/30">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">Автоматы</h3>
                <p className="text-xs text-muted-foreground">Найти рядом</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Secondary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* QR Scan */}
          <Card 
            className="p-3 bg-secondary/50 border-0 rounded-xl cursor-pointer hover:bg-secondary/70 transition-colors active:scale-[0.98]"
            onClick={() => {
              haptic.selection();
              navigate('/scan');
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground">QR Скан</h4>
                <p className="text-xs text-muted-foreground">Быстрый заказ</p>
              </div>
            </div>
          </Card>

          {/* Promotions */}
          <Card 
            className="p-3 bg-secondary/50 border-0 rounded-xl cursor-pointer hover:bg-secondary/70 transition-colors active:scale-[0.98]"
            onClick={() => {
              haptic.selection();
              navigate('/promotions');
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Percent className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground">Акции</h4>
                <p className="text-xs text-muted-foreground">3 активных</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Bonus Card - Compact version */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link href="/profile/bonuses">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-espresso via-espresso/95 to-espresso/90 text-white p-4 rounded-2xl shadow-lg shadow-espresso/20">
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs mb-0.5">Бонусный баланс</p>
                  <p className="font-display text-2xl font-bold">
                    {formatPoints(points)}
                    <span className="text-sm font-normal text-white/60 ml-1">UZS</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Level badge */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-caramel">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">Silver</span>
                    </div>
                    <p className="text-xs text-white/50">До Gold: 5</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Quick Stats - Only if has order history */}
        {hasOrderHistory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-3"
          >
            <Card className="p-3 text-center bg-secondary/50 border-0 rounded-xl">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="font-display font-bold text-foreground">{orderStats.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Заказов</p>
            </Card>
            <Card className="p-3 text-center bg-secondary/50 border-0 rounded-xl">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">₿</span>
              </div>
              <p className="font-display font-bold text-foreground">{formatPrice(orderStats.totalSpent)}</p>
              <p className="text-xs text-muted-foreground">Потрачено</p>
            </Card>
            <Card className="p-3 text-center bg-secondary/50 border-0 rounded-xl">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <p className="font-display font-bold text-foreground">2.5</p>
              <p className="text-xs text-muted-foreground">мин</p>
            </Card>
          </motion.div>
        )}

        {/* Personalized Recommendations */}
        {hasOrderHistory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
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
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-caramel/90 to-caramel p-4 rounded-2xl">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 opacity-20">
              <img src="/images/espresso-card.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium mb-1">
                  Акция
                </span>
                <h3 className="font-display text-base font-bold text-white">
                  Второй кофе -50%
                </h3>
                <p className="text-white/80 text-xs">
                  При заказе от 30 000 UZS
                </p>
              </div>
              <Button 
                size="sm" 
                className="bg-white text-espresso hover:bg-white/90 rounded-xl h-9"
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

        {/* Popular section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-foreground">Популярное</h3>
            <Link href="/menu/1">
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
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Card 
                  className="overflow-hidden border-0 bg-card rounded-2xl cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.98]"
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
