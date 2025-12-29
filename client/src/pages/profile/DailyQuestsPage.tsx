/**
 * VendHub TWA - Daily Quests Page
 * Daily challenges with bonus rewards
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
  Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Quest type icons
const questTypeIcons: Record<string, React.ElementType> = {
  order: ShoppingBag,
  spend: Wallet,
  visit: Eye,
  share: Share2,
  review: MessageSquare,
};

export default function DailyQuestsPage() {
  const { haptic, isTelegram } = useTelegram();
  const { fireConfetti, fireEmoji } = useConfetti();
  const utils = trpc.useUtils();
  
  // Get daily quests
  const { data: quests, isLoading } = trpc.profile.dailyQuests.useQuery();
  
  // Claim reward mutation
  const claimRewardMutation = trpc.profile.claimQuestReward.useMutation({
    onSuccess: (data, variables) => {
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

  // Get time until reset (midnight)
  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}ч ${minutes}м`;
  };

  const completedCount = quests?.filter(q => q.isCompleted).length || 0;
  const totalQuests = quests?.length || 0;

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
          <h1 className="font-display text-lg font-semibold">Ежедневные задания</h1>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="coffee-card overflow-hidden">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-foreground">
                        Сегодня
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {completedCount}/{totalQuests} выполнено
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{getTimeUntilReset()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">до сброса</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / Math.max(totalQuests, 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
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
          ) : quests && quests.length > 0 ? (
            quests.map((quest, index) => {
              const QuestIcon = questTypeIcons[quest.type] || Gift;
              const progress = Math.min((quest.currentValue / quest.targetValue) * 100, 100);
              
              return (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className={cn(
                    "coffee-card p-4 transition-all",
                    quest.isCompleted && !quest.rewardClaimed && "ring-2 ring-green-500/50"
                  )}>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        quest.isCompleted 
                          ? "bg-green-100 dark:bg-green-900/30" 
                          : "bg-purple-100 dark:bg-purple-900/30"
                      )}>
                        {quest.isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <QuestIcon className="w-6 h-6 text-purple-500" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">
                          {quest.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {quest.description}
                        </p>
                        
                        {/* Progress bar */}
                        {!quest.isCompleted && (
                          <div className="space-y-1">
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(quest.currentValue)} / {formatNumber(quest.targetValue)}
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
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
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
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Нет заданий</h3>
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
            Задания обновляются каждый день в полночь
          </p>
        </motion.div>
      </main>
    </div>
  );
}
