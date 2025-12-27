/**
 * VendHub TWA - Bonuses Page
 * "Warm Brew" Design System
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { ArrowLeft, Gift, Sparkles, TrendingUp, TrendingDown, Coffee } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Mock loyalty data
const mockLoyalty = {
  pointsBalance: 25000,
  lifetimePoints: 150000,
  level: "silver" as const,
  nextLevelPoints: 200000,
  pointsToNextLevel: 50000,
};

const mockTransactions = [
  { id: "1", delta: 495, reason: "Покупка", description: "KIUT Корпус А", createdAt: "2024-12-26T10:30:00" },
  { id: "2", delta: 220, reason: "Покупка", description: "IT Park", createdAt: "2024-12-25T14:15:00" },
  { id: "3", delta: -5000, reason: "Списание", description: "Скидка на заказ", createdAt: "2024-12-24T16:00:00" },
  { id: "4", delta: 1000, reason: "Бонус", description: "Приветственный бонус", createdAt: "2024-12-20T12:00:00" },
];

const levels = [
  { name: "Bronze", nameRu: "Бронза", minPoints: 0, discount: 3, color: "#CD7F32" },
  { name: "Silver", nameRu: "Серебро", minPoints: 100000, discount: 5, color: "#C0C0C0" },
  { name: "Gold", nameRu: "Золото", minPoints: 200000, discount: 7, color: "#FFD700" },
  { name: "Platinum", nameRu: "Платина", minPoints: 500000, discount: 10, color: "#E5E4E2" },
];

function formatPoints(points: number): string {
  return new Intl.NumberFormat('ru-RU').format(points);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

export default function Bonuses() {
  const { haptic } = useTelegram();
  const currentLevelIndex = levels.findIndex(l => l.name.toLowerCase() === mockLoyalty.level);
  const currentLevel = levels[currentLevelIndex];
  const nextLevel = levels[currentLevelIndex + 1];

  const levelProgress = nextLevel 
    ? ((mockLoyalty.lifetimePoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-display text-xl font-bold">Бонусы и уровни</h1>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="coffee-card bg-gradient-to-br from-[#5D4037] to-[#3E2723] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5" />
                <span className="font-medium">Бонусный баланс</span>
              </div>
              
              <div className="text-center py-6">
                <p className="font-display text-5xl font-bold">
                  {formatPoints(mockLoyalty.pointsBalance)}
                </p>
                <p className="text-white/70 mt-1">UZS</p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" style={{ color: currentLevel.color }} />
                <span>Уровень: {currentLevel.nameRu}</span>
                <span className="text-white/50">•</span>
                <span>Скидка {currentLevel.discount}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="coffee-card">
            <h2 className="font-semibold text-foreground mb-4">Прогресс уровня</h2>
            
            {/* Level indicators */}
            <div className="flex justify-between mb-2">
              {levels.map((level, i) => (
                <div 
                  key={level.name}
                  className={`text-center ${i <= currentLevelIndex ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div 
                    className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center"
                    style={{ backgroundColor: level.color }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs">{level.nameRu}</span>
                </div>
              ))}
            </div>
            
            {/* Progress bar */}
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ 
                  background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || currentLevel.color})` 
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(levelProgress, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            
            {nextLevel && (
              <p className="text-sm text-muted-foreground mt-3 text-center">
                До {nextLevel.nameRu}: ещё {formatPoints(mockLoyalty.pointsToNextLevel)} UZS
              </p>
            )}
          </Card>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="coffee-card">
            <h2 className="font-semibold text-foreground mb-4">Преимущества уровней</h2>
            <div className="space-y-3">
              {levels.map((level) => (
                <div 
                  key={level.name}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    level.name.toLowerCase() === mockLoyalty.level 
                      ? 'bg-[#5D4037]/10 border border-[#5D4037]/20' 
                      : 'bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: level.color }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{level.nameRu}</p>
                      <p className="text-xs text-muted-foreground">от {formatPoints(level.minPoints)} UZS</p>
                    </div>
                  </div>
                  <span className="font-semibold text-[#5D4037]">{level.discount}%</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="coffee-card">
            <h2 className="font-semibold text-foreground mb-4">История бонусов</h2>
            <div className="space-y-3">
              {mockTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.delta > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.delta > 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{tx.reason}</p>
                      <p className="text-xs text-muted-foreground">{tx.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.delta > 0 ? '+' : ''}{formatPoints(tx.delta)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>

      <div className="h-8" />
    </div>
  );
}
