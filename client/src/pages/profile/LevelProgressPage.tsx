/**
 * Level Progress Page
 * Shows user's loyalty level progress with visualization
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Crown, Gift, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { 
  getLevelDiscount, 
  getLoyaltyLevelName, 
  getNextLevelInfo, 
  LEVEL_THRESHOLDS,
  formatPoints 
} from "@/stores/userStore";

const levelColors = {
  bronze: { bg: 'from-amber-600 to-amber-800', text: 'text-amber-600', ring: 'ring-amber-500' },
  silver: { bg: 'from-gray-400 to-gray-600', text: 'text-gray-500', ring: 'ring-gray-400' },
  gold: { bg: 'from-yellow-400 to-yellow-600', text: 'text-yellow-500', ring: 'ring-yellow-400' },
  platinum: { bg: 'from-purple-400 to-purple-700', text: 'text-purple-500', ring: 'ring-purple-400' },
};

const levelEmojis = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

const levelBenefits = {
  bronze: [
    '1% кэшбэк с каждого заказа',
    'Доступ к базовым акциям',
    'Накопление баллов',
  ],
  silver: [
    '3% постоянная скидка на все заказы',
    '1% кэшбэк с каждого заказа',
    'Приоритетные уведомления об акциях',
    'Доступ к специальным промокодам',
  ],
  gold: [
    '5% постоянная скидка на все заказы',
    '1% кэшбэк с каждого заказа',
    'Эксклюзивные акции только для Gold',
    'Бесплатный напиток в день рождения',
    'Приоритетная поддержка',
  ],
  platinum: [
    '10% постоянная скидка на все заказы',
    '1% кэшбэк с каждого заказа',
    'VIP доступ ко всем акциям',
    'Бесплатный напиток каждый месяц',
    'Персональный менеджер',
    'Ранний доступ к новинкам',
  ],
};

export default function LevelProgressPage() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.profile.stats.useQuery();

  const currentLevel = (stats?.loyaltyLevel || 'bronze') as keyof typeof levelColors;
  const totalSpent = stats?.totalSpent || 0;
  const discount = getLevelDiscount(currentLevel);
  const nextLevelInfo = getNextLevelInfo(currentLevel, totalSpent);

  // Calculate progress percentage
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const nextThreshold = nextLevelInfo.nextLevel ? LEVEL_THRESHOLDS[nextLevelInfo.nextLevel] : totalSpent;
  const progressInLevel = totalSpent - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  const progressPercent = nextLevelInfo.nextLevel 
    ? Math.min(100, Math.round((progressInLevel / levelRange) * 100))
    : 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">Уровень лояльности</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Current Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${levelColors[currentLevel].bg} text-white p-6 rounded-2xl`}>
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl">
                    {levelEmojis[currentLevel]}
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Ваш уровень</p>
                    <h2 className="font-display text-2xl font-bold">
                      {getLoyaltyLevelName(currentLevel)}
                    </h2>
                  </div>
                </div>
                {discount > 0 && (
                  <div className="text-right">
                    <p className="text-white/70 text-xs">Скидка</p>
                    <p className="font-display text-3xl font-bold">{discount}%</p>
                  </div>
                )}
              </div>

              {/* Progress to next level */}
              {nextLevelInfo.nextLevel && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/70">До {getLoyaltyLevelName(nextLevelInfo.nextLevel)}</span>
                    <span className="font-medium">{formatPoints(nextLevelInfo.amountToNext)} UZS</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-2 text-center">
                    {progressPercent}% до следующего уровня
                  </p>
                </div>
              )}

              {!nextLevelInfo.nextLevel && (
                <div className="mt-4 text-center">
                  <p className="text-white/80">🎉 Вы достигли максимального уровня!</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Всего потрачено</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              {formatPoints(totalSpent)} <span className="text-sm font-normal">UZS</span>
            </p>
          </Card>
          <Card className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Баллов</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              {formatPoints(stats?.pointsBalance || 0)}
            </p>
          </Card>
        </motion.div>

        {/* Current Level Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className={`w-5 h-5 ${levelColors[currentLevel].text}`} />
              <h3 className="font-semibold text-foreground">Ваши преимущества</h3>
            </div>
            <ul className="space-y-3">
              {levelBenefits[currentLevel].map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${levelColors[currentLevel].bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Next Level Preview */}
        {nextLevelInfo.nextLevel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4 bg-card border border-border rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crown className={`w-5 h-5 ${levelColors[nextLevelInfo.nextLevel].text}`} />
                  <h3 className="font-semibold text-foreground">
                    Следующий уровень: {getLoyaltyLevelName(nextLevelInfo.nextLevel)}
                  </h3>
                </div>
                <span className="text-2xl">{levelEmojis[nextLevelInfo.nextLevel]}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Потратьте ещё <span className="font-semibold text-foreground">{formatPoints(nextLevelInfo.amountToNext)} UZS</span> для получения:
              </p>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${levelColors[nextLevelInfo.nextLevel].bg}/10 border border-${levelColors[nextLevelInfo.nextLevel].text}/20`}>
                <p className="text-sm font-medium text-foreground">
                  🎁 Постоянная скидка <span className="font-bold">{nextLevelInfo.nextDiscount}%</span> на все заказы
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* All Levels Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold text-foreground mb-3">Все уровни</h3>
          <div className="space-y-2">
            {(['bronze', 'silver', 'gold', 'platinum'] as const).map((level) => {
              const isCurrentLevel = level === currentLevel;
              const isPastLevel = LEVEL_THRESHOLDS[level] < LEVEL_THRESHOLDS[currentLevel];
              const isFutureLevel = LEVEL_THRESHOLDS[level] > LEVEL_THRESHOLDS[currentLevel];
              
              return (
                <Card 
                  key={level}
                  className={`p-3 rounded-xl border transition-all ${
                    isCurrentLevel 
                      ? `border-2 ${levelColors[level].ring} bg-gradient-to-r ${levelColors[level].bg}/10`
                      : isPastLevel
                        ? 'border-border bg-card opacity-60'
                        : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{levelEmojis[level]}</span>
                      <div>
                        <p className={`font-medium ${isCurrentLevel ? levelColors[level].text : 'text-foreground'}`}>
                          {getLoyaltyLevelName(level)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {LEVEL_THRESHOLDS[level] === 0 
                            ? 'Начальный уровень' 
                            : `От ${formatPoints(LEVEL_THRESHOLDS[level])} UZS`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isCurrentLevel ? levelColors[level].text : 'text-foreground'}`}>
                        {getLevelDiscount(level)}%
                      </p>
                      <p className="text-xs text-muted-foreground">скидка</p>
                    </div>
                  </div>
                  {isCurrentLevel && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-center text-muted-foreground">
                        ✨ Ваш текущий уровень
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Link to Points History */}
        <Link href="/profile/points-history">
          <Card className="p-4 bg-card border border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">История баллов</p>
                  <p className="text-xs text-muted-foreground">Все начисления и списания</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </Link>
      </main>
    </div>
  );
}
