/**
 * VendHub TWA - Achievements Page
 * Badges and achievements for user engagement
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { trpc } from "@/lib/trpc";
import { useConfetti } from "@/hooks/useConfetti";
import { 
  ArrowLeft,
  Trophy,
  ShoppingBag,
  Users,
  Star,
  Coffee,
  Heart,
  Zap,
  Crown,
  Gift,
  Target,
  Flame,
  Award,
  Lock
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { cn } from "@/lib/utils";

// Badge definitions
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'orders' | 'social' | 'loyalty' | 'special';
  requirement: number;
  currentValue: number;
  unlocked: boolean;
  unlockedAt?: Date;
  color: string;
  bgColor: string;
}

// Badge categories
const categories = [
  { id: 'orders', name: 'Заказы', icon: ShoppingBag },
  { id: 'social', name: 'Социальное', icon: Users },
  { id: 'loyalty', name: 'Лояльность', icon: Star },
  { id: 'special', name: 'Особые', icon: Trophy },
];

export default function AchievementsPage() {
  const { haptic, isTelegram } = useTelegram();
  const { fireConfetti, fireEmoji } = useConfetti();
  
  // Get user stats for badge progress
  const { data: userStats } = trpc.profile.stats.useQuery();
  
  useTelegramBackButton({
    isVisible: true,
    onClick: () => window.history.back(),
  });

  // Calculate badge progress based on user stats
  const totalOrders = userStats?.totalOrders || 0;
  const totalSpent = userStats?.totalSpent || 0;
  const pointsBalance = userStats?.pointsBalance || 0;
  const loyaltyLevel = userStats?.loyaltyLevel || 'bronze';

  // Define all badges with progress
  const badges: Badge[] = [
    // Orders category
    {
      id: 'first_order',
      name: 'Первый глоток',
      description: 'Сделайте первый заказ',
      icon: Coffee,
      category: 'orders',
      requirement: 1,
      currentValue: totalOrders,
      unlocked: totalOrders >= 1,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      id: 'regular',
      name: 'Постоянный клиент',
      description: 'Сделайте 10 заказов',
      icon: Heart,
      category: 'orders',
      requirement: 10,
      currentValue: totalOrders,
      unlocked: totalOrders >= 10,
      color: 'text-red-500',
      bgColor: 'bg-red-100',
    },
    {
      id: 'coffee_lover',
      name: 'Кофеман',
      description: 'Сделайте 25 заказов',
      icon: Zap,
      category: 'orders',
      requirement: 25,
      currentValue: totalOrders,
      unlocked: totalOrders >= 25,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
    },
    {
      id: 'coffee_addict',
      name: 'Кофейный гуру',
      description: 'Сделайте 50 заказов',
      icon: Flame,
      category: 'orders',
      requirement: 50,
      currentValue: totalOrders,
      unlocked: totalOrders >= 50,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
    },
    {
      id: 'coffee_master',
      name: 'Мастер кофе',
      description: 'Сделайте 100 заказов',
      icon: Award,
      category: 'orders',
      requirement: 100,
      currentValue: totalOrders,
      unlocked: totalOrders >= 100,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
    
    // Loyalty category
    {
      id: 'silver_member',
      name: 'Серебряный статус',
      description: 'Достигните уровня Серебро',
      icon: Star,
      category: 'loyalty',
      requirement: 100000,
      currentValue: totalSpent,
      unlocked: ['silver', 'gold', 'platinum'].includes(loyaltyLevel),
      color: 'text-gray-400',
      bgColor: 'bg-gray-100',
    },
    {
      id: 'gold_member',
      name: 'Золотой статус',
      description: 'Достигните уровня Золото',
      icon: Crown,
      category: 'loyalty',
      requirement: 500000,
      currentValue: totalSpent,
      unlocked: ['gold', 'platinum'].includes(loyaltyLevel),
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
    },
    {
      id: 'platinum_member',
      name: 'Платиновый статус',
      description: 'Достигните уровня Платина',
      icon: Trophy,
      category: 'loyalty',
      requirement: 1000000,
      currentValue: totalSpent,
      unlocked: loyaltyLevel === 'platinum',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
    {
      id: 'points_collector',
      name: 'Коллекционер баллов',
      description: 'Накопите 50,000 баллов',
      icon: Gift,
      category: 'loyalty',
      requirement: 50000,
      currentValue: pointsBalance,
      unlocked: pointsBalance >= 50000,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
    },
    {
      id: 'points_master',
      name: 'Мастер баллов',
      description: 'Накопите 100,000 баллов',
      icon: Target,
      category: 'loyalty',
      requirement: 100000,
      currentValue: pointsBalance,
      unlocked: pointsBalance >= 100000,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100',
    },
    
    // Special category
    {
      id: 'early_bird',
      name: 'Ранняя пташка',
      description: 'Зарегистрируйтесь в приложении',
      icon: Star,
      category: 'special',
      requirement: 1,
      currentValue: 1, // Always unlocked for registered users
      unlocked: true,
      color: 'text-sky-500',
      bgColor: 'bg-sky-100',
    },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalBadges = badges.length;
  const progressPercent = Math.round((unlockedCount / totalBadges) * 100);

  const handleBadgeClick = (badge: Badge) => {
    haptic.selection();
    if (badge.unlocked) {
      fireConfetti('achievement');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const getProgress = (badge: Badge) => {
    if (badge.unlocked) return 100;
    return Math.min(Math.round((badge.currentValue / badge.requirement) * 100), 99);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          {!isTelegram && (
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <h1 className="font-display text-lg font-semibold">Достижения</h1>
        </div>
      </div>

      <main className="px-4 py-4 space-y-6">
        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="coffee-card overflow-hidden">
            <div className="relative p-6">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-caramel/20 to-transparent rounded-full blur-2xl" />
              
              <div className="relative flex items-center gap-6">
                {/* Trophy icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {unlockedCount} / {totalBadges}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-2">
                    достижений получено
                  </p>
                  
                  {/* Progress bar */}
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-caramel to-amber-500 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {progressPercent}% выполнено
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Badges by Category */}
        {categories.map((category, categoryIndex) => {
          const categoryBadges = badges.filter(b => b.category === category.id);
          if (categoryBadges.length === 0) return null;
          
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (categoryIndex + 1) }}
            >
              <div className="flex items-center gap-2 mb-3">
                <category.icon className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {categoryBadges.filter(b => b.unlocked).length}/{categoryBadges.length}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {categoryBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card 
                      className={cn(
                        "coffee-card p-4 cursor-pointer transition-all hover:scale-[1.02]",
                        !badge.unlocked && "opacity-60"
                      )}
                      onClick={() => handleBadgeClick(badge)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Badge icon */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center relative",
                          badge.unlocked ? badge.bgColor : "bg-gray-100 dark:bg-gray-800"
                        )}>
                          {badge.unlocked ? (
                            <badge.icon className={cn("w-6 h-6", badge.color)} />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                          
                          {/* Unlocked indicator */}
                          {badge.unlocked && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate">
                            {badge.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {badge.description}
                          </p>
                          
                          {/* Progress */}
                          {!badge.unlocked && (
                            <div className="mt-2">
                              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-caramel/60 rounded-full transition-all"
                                  style={{ width: `${getProgress(badge)}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {formatNumber(badge.currentValue)} / {formatNumber(badge.requirement)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Motivational message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4"
        >
          <p className="text-sm text-muted-foreground">
            {unlockedCount < totalBadges 
              ? `Ещё ${totalBadges - unlockedCount} достижений ждут вас! ☕`
              : "Поздравляем! Вы получили все достижения! 🎉"
            }
          </p>
        </motion.div>
      </main>
    </div>
  );
}
