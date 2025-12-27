/**
 * VendHub TWA - Home Page
 * "Warm Brew" Design System
 * 
 * Features:
 * - QR Scanner area (simulated for web)
 * - Location selection
 * - User profile quick access
 * - Bonus balance display
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useUserStore, formatPoints } from "@/stores/userStore";
import { Coffee, MapPin, QrCode, User, Gift, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Mock user data for demo
const mockUser = {
  firstName: "Jamshid",
  pointsBalance: 25000,
  level: "silver" as const,
};

export default function Home() {
  const { user, haptic, isTelegram } = useTelegram();
  const { profile, loyalty } = useUserStore();
  
  const displayName = user?.first_name || profile?.firstName || mockUser.firstName;
  const points = loyalty?.pointsBalance || mockUser.pointsBalance;

  const handleQrScan = () => {
    haptic.impact('medium');
    // In real app, this would open camera or use Telegram's QR scanner
  };

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

        {/* QR Scanner Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
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
          transition={{ duration: 0.4, delay: 0.2 }}
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
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          <Link href="/profile/history">
            <Card className="coffee-card hover:shadow-md transition-shadow cursor-pointer p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-[#5D4037]" />
                </div>
                <span className="text-sm font-medium">История заказов</span>
              </div>
            </Card>
          </Link>
          
          <Link href="/profile/settings">
            <Card className="coffee-card hover:shadow-md transition-shadow cursor-pointer p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-[#5D4037]" />
                </div>
                <span className="text-sm font-medium">Настройки</span>
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
