/**
 * VendHub TWA - Leaderboard Page
 * Rankings by achievements and orders with period filters
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  User,
  Calendar,
  CalendarDays,
  Infinity
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Period = 'week' | 'month' | 'all';

const periodLabels: Record<Period, string> = {
  week: 'Неделя',
  month: 'Месяц',
  all: 'Всё время'
};

const periodIcons: Record<Period, typeof Calendar> = {
  week: Calendar,
  month: CalendarDays,
  all: Infinity
};

export default function LeaderboardPage() {
  const { haptic, isTelegram } = useTelegram();
  const [period, setPeriod] = useState<Period>('all');
  
  // Get leaderboard with period filter
  const { data: leaderboardData, isLoading } = trpc.profile.leaderboard.useQuery({ period });
  const { data: userStats } = trpc.profile.stats.useQuery();
  
  useTelegramBackButton({
    isVisible: true,
    onClick: () => window.history.back(),
  });

  const handlePeriodChange = (newPeriod: Period) => {
    haptic.selection();
    setPeriod(newPeriod);
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'platinum': return 'text-purple-500';
      case 'gold': return 'text-yellow-500';
      case 'silver': return 'text-gray-400';
      default: return 'text-amber-700';
    }
  };

  const getLevelEmoji = (level: string) => {
    switch (level) {
      case 'platinum': return '💎';
      case 'gold': return '👑';
      case 'silver': return '🥈';
      default: return '🥉';
    }
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
          <h1 className="font-display text-lg font-semibold">Таблица лидеров</h1>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        {/* Period Filter Tabs */}
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
          {(Object.keys(periodLabels) as Period[]).map((p) => {
            const Icon = periodIcons[p];
            return (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                  period === p 
                    ? "bg-caramel text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{periodLabels[p]}</span>
              </button>
            );
          })}
        </div>

        {/* Current User Rank Card */}
        {leaderboardData?.currentUserRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`rank-${period}`}
          >
            <Card className="coffee-card overflow-hidden">
              <div className="relative p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-caramel/20 to-transparent rounded-full blur-2xl" />
                
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-caramel to-espresso flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      #{leaderboardData.currentUserRank}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-bold text-foreground">
                      Ваша позиция
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {userStats?.totalOrders || 0} заказов за {periodLabels[period].toLowerCase()}
                    </p>
                  </div>
                  
                  <Trophy className="w-8 h-8 text-caramel" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {leaderboardData && leaderboardData.entries.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            key={`podium-${period}`}
            className="flex items-end justify-center gap-3 py-4"
          >
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {leaderboardData.entries[1].telegramPhotoUrl ? (
                  <img 
                    src={leaderboardData.entries[1].telegramPhotoUrl}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-400"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-400">
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                      {getInitials(leaderboardData.entries[1].name, leaderboardData.entries[1].telegramUsername)}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground truncate max-w-16 text-center">
                {leaderboardData.entries[1].name || leaderboardData.entries[1].telegramUsername || 'User'}
              </p>
              <div className="mt-2 h-16 w-20 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
                <Medal className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            
            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {leaderboardData.entries[0].telegramPhotoUrl ? (
                  <img 
                    src={leaderboardData.entries[0].telegramPhotoUrl}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center border-2 border-yellow-500">
                    <span className="text-xl font-bold text-yellow-600">
                      {getInitials(leaderboardData.entries[0].name, leaderboardData.entries[0].telegramUsername)}
                    </span>
                  </div>
                )}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground truncate max-w-16 text-center">
                {leaderboardData.entries[0].name || leaderboardData.entries[0].telegramUsername || 'User'}
              </p>
              <div className="mt-2 h-20 w-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-t-lg flex items-center justify-center">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {leaderboardData.entries[2].telegramPhotoUrl ? (
                  <img 
                    src={leaderboardData.entries[2].telegramPhotoUrl}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-600"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border-2 border-amber-600">
                    <span className="text-lg font-bold text-amber-700">
                      {getInitials(leaderboardData.entries[2].name, leaderboardData.entries[2].telegramUsername)}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground truncate max-w-16 text-center">
                {leaderboardData.entries[2].name || leaderboardData.entries[2].telegramUsername || 'User'}
              </p>
              <div className="mt-2 h-12 w-20 bg-amber-100 dark:bg-amber-900/30 rounded-t-lg flex items-center justify-center">
                <Medal className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard List */}
        <div className="space-y-2">
          {isLoading ? (
            // Loading skeleton
            [...Array(10)].map((_, i) => (
              <Card key={i} className="coffee-card p-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary" />
                  <div className="w-10 h-10 rounded-full bg-secondary" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-secondary rounded mb-1" />
                    <div className="h-3 w-16 bg-secondary rounded" />
                  </div>
                  <div className="h-4 w-12 bg-secondary rounded" />
                </div>
              </Card>
            ))
          ) : leaderboardData && leaderboardData.entries.length > 0 ? (
            leaderboardData.entries.slice(3).map((entry, index) => {
              const rank = index + 4;
              const isCurrentUser = false; // Will be highlighted by API response
              
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className={cn(
                    "coffee-card p-3",
                    isCurrentUser && "ring-2 ring-caramel/50 bg-caramel/5"
                  )}>
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">
                          {rank}
                        </span>
                      </div>
                      
                      {/* Avatar */}
                      {entry.telegramPhotoUrl ? (
                        <img 
                          src={entry.telegramPhotoUrl}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {entry.name || entry.telegramUsername || 'Пользователь'}
                          {isCurrentUser && <span className="text-caramel ml-1">(Вы)</span>}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={getLevelColor(entry.loyaltyLevel)}>
                            {getLevelEmoji(entry.loyaltyLevel)}
                          </span>
                          <span>{entry.totalOrders} заказов</span>
                        </div>
                      </div>
                      
                      {/* Achievements */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Trophy className="w-4 h-4 text-caramel" />
                        <span className="text-sm font-medium text-foreground">
                          {entry.achievementCount}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Нет данных</h3>
              <p className="text-sm text-muted-foreground">
                Таблица лидеров за {periodLabels[period].toLowerCase()} пока пуста
              </p>
            </motion.div>
          )}
        </div>

        {/* Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground py-4"
        >
          Рейтинг обновляется в реальном времени
        </motion.p>
      </main>
    </div>
  );
}
