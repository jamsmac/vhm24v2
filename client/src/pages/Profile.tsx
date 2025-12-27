/**
 * VendHub TWA - Profile Page
 * "Warm Brew" Design System
 * 
 * Features:
 * - User avatar and info
 * - Bonus balance display
 * - Loyalty level progress
 * - Navigation to sub-pages
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useUserStore, formatPoints, getLoyaltyLevelName } from "@/stores/userStore";
import { ArrowLeft, Gift, History, Settings, HelpCircle, ChevronRight, Sparkles, User, LogOut, Heart } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Mock data for demo
const mockProfile = {
  firstName: "Jamshid",
  lastName: "M.",
  telegramUsername: "@jamshid_tg",
};

const mockLoyalty = {
  pointsBalance: 25000,
  lifetimePoints: 150000,
  level: "silver" as const,
  nextLevelPoints: 200000,
  pointsToNextLevel: 50000,
};

export default function Profile() {
  const { user, haptic, webApp } = useTelegram();
  const { profile, loyalty, logout } = useUserStore();

  const displayProfile = profile || {
    firstName: user?.first_name || mockProfile.firstName,
    lastName: user?.last_name || mockProfile.lastName,
    telegramUsername: user?.username ? `@${user.username}` : mockProfile.telegramUsername,
  };

  const displayLoyalty = loyalty || mockLoyalty;

  const levelProgress = ((displayLoyalty.lifetimePoints / displayLoyalty.nextLevelPoints) * 100);

  const menuItems = [
    { icon: Heart, label: "Избранное", href: "/profile/favorites" },
    { icon: History, label: "История заказов", href: "/profile/history" },
    { icon: Gift, label: "Бонусы и уровни", href: "/profile/bonuses" },
    { icon: Settings, label: "Настройки", href: "/profile/settings" },
    { icon: HelpCircle, label: "Помощь", href: "/profile/help" },
  ];

  const handleLogout = () => {
    haptic.impact('medium');
    logout();
    webApp?.close();
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-display text-xl font-bold">Мой профиль</h1>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="coffee-card">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8956C] flex items-center justify-center">
                {user?.photo_url ? (
                  <img 
                    src={user.photo_url} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              
              {/* Info */}
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  {displayProfile.firstName} {displayProfile.lastName}
                </h2>
                <p className="text-muted-foreground">{displayProfile.telegramUsername}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Bonus Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="coffee-card bg-gradient-to-br from-[#5D4037] to-[#3E2723] text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                <span className="font-medium">Бонусный баланс</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-[#C0C0C0]" />
                <span className="text-sm">{getLoyaltyLevelName(displayLoyalty.level)}</span>
              </div>
            </div>
            
            <div className="text-center py-4">
              <p className="font-display text-4xl font-bold">
                {formatPoints(displayLoyalty.pointsBalance)}
              </p>
              <p className="text-white/70 text-sm mt-1">UZS</p>
            </div>
            
            {/* Level Progress */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/70">До {getLoyaltyLevelName('gold')}</span>
                <span>{formatPoints(displayLoyalty.pointsToNextLevel)} UZS</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#C0C0C0] to-[#FFD700] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(levelProgress, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-2"
        >
          {menuItems.map((item, index) => (
            <Link key={item.href} href={item.href}>
              <Card 
                className="coffee-card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => haptic.selection()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#5D4037]" />
                    </div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Выйти
          </Button>
        </motion.div>
      </main>

      {/* Bottom safe area spacer */}
      <div className="h-8" />
    </div>
  );
}
