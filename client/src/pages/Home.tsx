/**
 * VendHub TWA - Modern Home Page
 * Clean, modern design with VendHub branding
 * Quick access to catalog and locations at the top
 * 
 * Dark Theme Support: All elements use theme-aware colors
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
import NotificationCenter from "@/components/NotificationCenter";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Mock user data for demo
const mockUser = {
  firstName: "Jamshid",
  pointsBalance: 25000,
  level: "silver" as const,
};

export default function Home() {
  const { user: telegramUser, haptic } = useTelegram();
  const { profile, loyalty } = useUserStore();
  const { favorites } = useFavoritesStore();
  const { items: cartItems } = useCartStore();
  const { getOrderStats, getCompletedOrders } = useOrderHistoryStore();
  const { unreadCount } = useNotificationsStore();
  const [, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const displayName = telegramUser?.first_name || profile?.firstName || mockUser.firstName;
  const points = loyalty?.pointsBalance || mockUser.pointsBalance;
  const orderStats = getOrderStats();
  const hasOrderHistory = getCompletedOrders().length > 0;
  
  // Welcome bonus state
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const { data: userStats, refetch: refetchStats } = trpc.profile.stats.useQuery();
  const claimBonusMutation = trpc.profile.claimWelcomeBonus.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setBonusClaimed(true);
        toast.success(`🎁 +${data.amount.toLocaleString('ru-RU')} баллов!`, {
          description: 'Приветственный бонус начислен!'
        });
        refetchStats();
        setTimeout(() => setShowWelcomeBanner(false), 3000);
      }
    },
    onError: () => {
      toast.error('Не удалось получить бонус');
    }
  });
  
  // Check if user should see welcome bonus banner
  useEffect(() => {
    if (userStats && !userStats.welcomeBonusReceived && !bonusClaimed) {
      setShowWelcomeBanner(true);
    }
  }, [userStats, bonusClaimed]);

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
        {/* Background gradient - theme aware */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-amber-100/30 dark:via-amber-900/20 to-background" />
        
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
              className="rounded-full relative text-foreground"
              onClick={() => {
                haptic.selection();
                setShowNotifications(true);
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
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
        
        {/* Welcome Bonus Banner */}
        <AnimatePresence>
          {showWelcomeBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="relative"
            >
              <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 p-4 rounded-2xl">
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-500/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl" />
                
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-foreground">🎉 Приветственный бонус!</h3>
                    <p className="text-sm text-muted-foreground">
                      Получите <span className="font-bold text-green-600 dark:text-green-400">15 000 баллов</span> — это бесплатный эспрессо!
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 flex-shrink-0"
                    onClick={() => {
                      haptic.impact('medium');
                      claimBonusMutation.mutate();
                    }}
                    disabled={claimBonusMutation.isPending || bonusClaimed}
                  >
                    {claimBonusMutation.isPending ? 'Загрузка...' : bonusClaimed ? '✓' : 'Получить'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Quick Actions - Prominent buttons for main navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Catalog Button */}
          <Card 
            className="p-4 border-2 border-amber-700/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-700/5 to-amber-700/10 dark:from-amber-600/10 dark:to-amber-600/20 rounded-2xl cursor-pointer hover:border-amber-700/40 dark:hover:border-amber-500/50 hover:shadow-lg transition-all active:scale-[0.98]"
            onClick={() => {
              haptic.selection();
              navigate('/menu/1');
            }}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-700 dark:bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-700/30 dark:shadow-amber-600/30">
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
            className="p-4 border-2 border-amber-500/20 dark:border-amber-400/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-500/10 dark:to-amber-500/20 rounded-2xl cursor-pointer hover:border-amber-500/40 dark:hover:border-amber-400/50 hover:shadow-lg transition-all active:scale-[0.98]"
            onClick={() => {
              haptic.selection();
              navigate('/locations');
            }}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 dark:bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
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
            className="p-3 bg-card border border-border rounded-xl cursor-pointer hover:bg-secondary/70 transition-colors active:scale-[0.98]"
            onClick={() => {
              haptic.selection();
              navigate('/scan');
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground">QR Скан</h4>
                <p className="text-xs text-muted-foreground">Быстрый заказ</p>
              </div>
            </div>
          </Card>

          {/* Promotions */}
          <Card 
            className="p-3 bg-card border border-border rounded-xl cursor-pointer hover:bg-secondary/70 transition-colors active:scale-[0.98]"
            onClick={() => {
              haptic.selection();
              navigate('/promotions');
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <Percent className="w-5 h-5 text-red-600 dark:text-red-400" />
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
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-800 via-amber-800/95 to-amber-900 text-white p-4 rounded-2xl shadow-lg shadow-amber-900/20">
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
                    <div className="flex items-center gap-1 text-amber-400">
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
            <Card className="p-3 text-center bg-card border border-border rounded-xl">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-display font-bold text-foreground">{orderStats.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Заказов</p>
            </Card>
            <Card className="p-3 text-center bg-card border border-border rounded-xl">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-sm">₿</span>
              </div>
              <p className="font-display font-bold text-foreground">{formatPrice(orderStats.totalSpent)}</p>
              <p className="text-xs text-muted-foreground">Потрачено</p>
            </Card>
            <Card className="p-3 text-center bg-card border border-border rounded-xl">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
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
          <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-amber-500/90 to-amber-500 p-4 rounded-2xl">
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
                className="bg-white text-amber-800 hover:bg-white/90 rounded-xl h-9"
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
                  className="overflow-hidden border border-border bg-card rounded-2xl cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.98]"
                  onClick={() => {
                    haptic.selection();
                    navigate(`/drink/${item.id}`);
                  }}
                >
                  <div className="aspect-square relative bg-secondary/50 dark:bg-secondary/30">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-foreground">{item.name}</h4>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-1">
                      {formatPrice(item.price)} UZS
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}
