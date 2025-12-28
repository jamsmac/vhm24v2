/**
 * VendHub TWA - Modern Profile Page
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useUserStore, formatPoints, getLoyaltyLevelName } from "@/stores/userStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useOrderHistoryStore } from "@/stores/orderHistoryStore";
import { 
  User, 
  Heart, 
  Clock, 
  Gift, 
  Settings, 
  HelpCircle, 
  ChevronRight,
  LogOut,
  Star,
  Sparkles,
  Users
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Mock user data
const mockUser = {
  firstName: "Jamshid",
  lastName: "Mamatov",
  phone: "+998 90 123 45 67",
  pointsBalance: 25000,
  level: "silver" as const,
};

export default function Profile() {
  const { user, haptic, webApp } = useTelegram();
  const { profile, loyalty, logout } = useUserStore();
  const { favorites } = useFavoritesStore();
  const { getOrderStats } = useOrderHistoryStore();
  
  const displayName = user?.first_name || profile?.firstName || mockUser.firstName;
  const lastName = user?.last_name || profile?.lastName || mockUser.lastName;
  const points = loyalty?.pointsBalance || mockUser.pointsBalance;
  const orderStats = getOrderStats();

  const menuItems = [
    { 
      icon: Heart, 
      label: 'Избранное', 
      href: '/profile/favorites',
      badge: favorites.length > 0 ? favorites.length : undefined,
      color: 'text-red-500'
    },
    { 
      icon: Clock, 
      label: 'История заказов', 
      href: '/profile/history',
      badge: orderStats.totalOrders > 0 ? orderStats.totalOrders : undefined,
      color: 'text-blue-500'
    },
    { 
      icon: Gift, 
      label: 'Бонусы и акции', 
      href: '/profile/bonuses',
      color: 'text-caramel'
    },
    { 
      icon: Star, 
      label: 'Задания', 
      href: '/profile/tasks',
      color: 'text-amber-500'
    },
    { 
      icon: Users, 
      label: 'Пригласить друзей', 
      href: '/profile/referral',
      color: 'text-green-500'
    },
    { 
      icon: Settings, 
      label: 'Настройки', 
      href: '/profile/settings',
      color: 'text-gray-500'
    },
    { 
      icon: HelpCircle, 
      label: 'Помощь', 
      href: '/profile/help',
      color: 'text-green-500'
    },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'from-amber-600 to-amber-700';
      case 'silver': return 'from-gray-400 to-gray-500';
      case 'gold': return 'from-yellow-400 to-yellow-500';
      case 'platinum': return 'from-slate-300 to-slate-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const handleLogout = () => {
    haptic.impact('medium');
    logout();
    webApp?.close();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-espresso via-espresso/95 to-espresso/90" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-caramel rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white rounded-full blur-2xl" />
        </div>
        
        <div className="relative px-4 pt-safe-top pb-8">
          {/* Profile info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 pt-4"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                {user?.photo_url ? (
                  <img 
                    src={user.photo_url} 
                    alt="Avatar" 
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              {/* Level badge */}
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-gradient-to-br ${getLevelColor(mockUser.level)} flex items-center justify-center shadow-lg`}>
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="font-display text-xl font-bold text-white">
                {displayName} {lastName}
              </h1>
              <p className="text-white/70 text-sm">{mockUser.phone}</p>
              <div className="flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3 text-caramel" />
                <span className="text-xs text-caramel font-medium capitalize">{getLoyaltyLevelName(mockUser.level)}</span>
              </div>
            </div>
          </motion.div>

          {/* Stats cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mt-6"
          >
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="font-display text-xl font-bold text-white">{orderStats.totalOrders}</p>
              <p className="text-xs text-white/60">Заказов</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="font-display text-xl font-bold text-white">{favorites.length}</p>
              <p className="text-xs text-white/60">Избранное</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="font-display text-xl font-bold text-caramel">{formatPoints(points)}</p>
              <p className="text-xs text-white/60">Бонусов</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Menu items */}
      <main className="px-4 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="coffee-card divide-y divide-border">
            {menuItems.map((item, index) => (
              <Link key={item.href} href={item.href}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="flex items-center gap-4 py-4 px-1 hover:bg-secondary/50 -mx-4 px-4 transition-colors cursor-pointer"
                  onClick={() => haptic.selection()}
                >
                  <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="flex-1 font-medium text-foreground">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-secondary rounded-full text-xs font-medium text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </Link>
            ))}
          </Card>
        </motion.div>

        {/* Logout button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <Button 
            variant="ghost" 
            className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Выйти из аккаунта
          </Button>
        </motion.div>

        {/* App version */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          VendHub v1.0.0
        </p>
      </main>
    </div>
  );
}
