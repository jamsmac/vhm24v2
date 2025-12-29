/**
 * VendHub TWA - Daily & Weekly Quests Page
 * Daily challenges with bonus rewards and streak tracking
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { trpc } from "@/lib/trpc";
import { useConfetti } from "@/hooks/useConfetti";
import { 
  ArrowLeft,
  Calendar,
  Gift,
  ShoppingBag,
  Wallet,
  Eye,
  Share2,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Trophy,
  Users,
  CalendarDays
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

// Quest type icons
const questTypeIcons: Record<string, React.ElementType> = {
  order: ShoppingBag,
  spend: Wallet,
  visit: Eye,
  share: Share2,
  review: MessageSquare,
  referral: Users,
};

export default function DailyQuestsPage() {
  const { haptic, isTelegram } = useTelegram();
  const { fireConfetti, fireEmoji } = useConfetti();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  
  // Get daily quests
  const { data: quests, isLoading } = trpc.profile.dailyQuests.useQuery();
  
  // Get user stats for streak
  const { data: stats } = trpc.profile.stats.useQuery();
  
  // Claim reward mutation
  const claimRewardMutation = trpc.profile.claimQuestReward.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        haptic.notification('success');
        fireConfetti('bonus');
        fireEmoji('🎁', 15);
        toast.success('Награда получена!');
        utils.profile.dailyQuests.invalidate();
        utils.profile.stats.invalidate();
      } else {
        toast.error('Не удалось получить награду');
      }
    },
    onError: () => {
      toast.error('Ошибка при получении награды');
    }
  });
  
  useTelegramBackButton({
    isVisible: true,
    onClick: () => window.history.back(),
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const handleClaimReward = (questId: number) => {
    haptic.selection();
    claimRewardMutation.mutate({ questId });
  };

  // Get time until reset (midnight for daily, Sunday for weekly)
  const getTimeUntilReset = (isWeekly: boolean) => {
    const now = new Date();
    let target: Date;
    
    if (isWeekly) {
      // Next Monday at midnight
      target = new Date(now);
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      target.setDate(target.getDate() + daysUntilMonday);
      target.setHours(0, 0, 0, 0);
    } else {
      // Tomorrow at midnight
      target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(0, 0, 0, 0);
    }
    
    const diff = target.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}д ${hours}ч`;
    }
    return `${hours}ч ${minutes}м`;
  };

  // Filter quests by type
  const dailyQuests = quests?.filter(q => !q.isWeekly) || [];
  const weeklyQuests = quests?.filter(q => q.isWeekly) || [];
  const currentQuests = activeTab === 'daily' ? dailyQuests : weeklyQuests;
  
  const completedDaily = dailyQuests.filter(q => q.isCompleted).length;
  const completedWeekly = weeklyQuests.filter(q => q.isCompleted).length;
  
  // Mock streak data (would come from stats in production)
  const currentStreak = stats?.currentStreak || 0;
  const longestStreak = stats?.longestStreak || 0;

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
          <h1 className="font-display text-lg font-semibold">Задания</h1>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="coffee-card overflow-hidden">
            <div className="relative p-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center",
                    currentStreak > 0 
                      ? "bg-gradient-to-br from-orange-500 to-red-500" 
                      : "bg-secondary"
                  )}>
                    <Flame className={cn(
                      "w-7 h-7",
                      currentStreak > 0 ? "text-white" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Текущая серия</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {currentStreak} {currentStreak === 1 ? 'день' : currentStreak < 5 ? 'дня' : 'дней'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-caramel">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm font-medium">Рекорд</span>
                  </div>
                  <p className="font-bold text-foreground">{longestStreak} дней</p>
                </div>
              </div>
              
              {/* Streak bonus info */}
              {currentStreak >= 7 && (
                <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <p className="text-xs text-orange-700 dark:text-orange-300 text-center">
                    🔥 Бонус x{Math.min(Math.floor(currentStreak / 7) + 1, 3)} за серию {currentStreak}+ дней!
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-secondary rounded-xl">
          <button
            onClick={() => setActiveTab('daily')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'daily'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-4 h-4" />
            Ежедневные
            {completedDaily > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full">
                {completedDaily}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'weekly'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Недельные
            {completedWeekly > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                {completedWeekly}
              </span>
            )}
          </button>
        </div>

        {/* Progress Card */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'daily' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="coffee-card overflow-hidden">
            <div className="relative p-4">
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl",
                activeTab === 'daily' 
                  ? "bg-gradient-to-br from-purple-500/20 to-transparent"
                  : "bg-gradient-to-br from-blue-500/20 to-transparent"
              )} />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-display text-base font-bold text-foreground">
                      {activeTab === 'daily' ? 'Сегодня' : 'Эта неделя'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'daily' 
                        ? `${completedDaily}/${dailyQuests.length} выполнено`
                        : `${completedWeekly}/${weeklyQuests.length} выполнено`
                      }
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{getTimeUntilReset(activeTab === 'weekly')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">до сброса</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${((activeTab === 'daily' ? completedDaily : completedWeekly) / 
                        Math.max(activeTab === 'daily' ? dailyQuests.length : weeklyQuests.length, 1)) * 100}%` 
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      activeTab === 'daily'
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500"
                    )}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quests List */}
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <Card key={i} className="coffee-card p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-secondary rounded mb-2" />
                    <div className="h-3 w-48 bg-secondary rounded" />
                  </div>
                  <div className="h-8 w-20 bg-secondary rounded" />
                </div>
              </Card>
            ))
          ) : currentQuests.length > 0 ? (
            currentQuests.map((quest, index) => {
              const QuestIcon = questTypeIcons[quest.type] || Gift;
              const progress = Math.min((quest.currentValue / quest.targetValue) * 100, 100);
              
              return (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className={cn(
                    "coffee-card p-4 transition-all",
                    quest.isCompleted && !quest.rewardClaimed && "ring-2 ring-green-500/50",
                    quest.isWeekly && "border-l-4 border-l-blue-500"
                  )}>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        quest.isCompleted 
                          ? "bg-green-100 dark:bg-green-900/30" 
                          : quest.isWeekly
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-purple-100 dark:bg-purple-900/30"
                      )}>
                        {quest.isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <QuestIcon className={cn(
                            "w-6 h-6",
                            quest.isWeekly ? "text-blue-500" : "text-purple-500"
                          )} />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {quest.title}
                          </h3>
                          {quest.isWeekly && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                              Недельное
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {quest.description}
                        </p>
                        
                        {/* Progress bar */}
                        {!quest.isCompleted && (
                          <div className="space-y-1">
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  quest.isWeekly ? "bg-blue-500" : "bg-purple-500"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(quest.currentValue)} / {formatNumber(quest.targetValue)}
                              {quest.type === 'spend' && ' UZS'}
                            </p>
                          </div>
                        )}
                        
                        {/* Reward */}
                        <div className="flex items-center gap-1 mt-2">
                          <Gift className="w-4 h-4 text-caramel" />
                          <span className="text-sm font-medium text-caramel">
                            +{formatNumber(quest.rewardPoints)} баллов
                          </span>
                        </div>
                      </div>
                      
                      {/* Action */}
                      <div className="shrink-0">
                        {quest.rewardClaimed ? (
                          <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Получено</span>
                          </div>
                        ) : quest.isCompleted ? (
                          <Button
                            size="sm"
                            className={cn(
                              "text-white",
                              quest.isWeekly
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            )}
                            onClick={() => handleClaimReward(quest.id)}
                            disabled={claimRewardMutation.isPending}
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Забрать
                          </Button>
                        ) : (
                          <div className="text-xs text-muted-foreground text-right">
                            {Math.round(progress)}%
                          </div>
                        )}
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
                {activeTab === 'daily' ? (
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <CalendarDays className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                Нет {activeTab === 'daily' ? 'ежедневных' : 'недельных'} заданий
              </h3>
              <p className="text-sm text-muted-foreground">
                Задания появятся скоро
              </p>
            </motion.div>
          )}
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-4"
        >
          <p className="text-xs text-muted-foreground">
            {activeTab === 'daily' 
              ? 'Ежедневные задания обновляются в полночь'
              : 'Недельные задания обновляются в понедельник'
            }
          </p>
        </motion.div>
      </main>
    </div>
  );
}
