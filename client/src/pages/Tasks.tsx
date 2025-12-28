/**
 * VendHub TWA - Gamification Tasks Page
 * Shows available tasks, progress, and points rewards
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Gift, 
  Star, 
  Check, 
  Lock, 
  Loader2,
  MessageCircle,
  Mail,
  ShoppingBag,
  Award,
  Calendar,
  Share2,
  Users,
  Sparkles,
  ChevronRight,
  Trophy,
  Zap
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

// Icon mapping for task types
const taskIcons: Record<string, React.ElementType> = {
  MessageCircle,
  Mail,
  ShoppingBag,
  Award,
  Calendar,
  Share2,
  Users,
  Gift,
  Star,
  Trophy,
  Zap,
};

const getTaskIcon = (iconName?: string) => {
  if (!iconName) return Gift;
  return taskIcons[iconName] || Gift;
};

export default function Tasks() {
  const { haptic } = useTelegram();
  const [, navigate] = useLocation();
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  
  // Fetch tasks with progress
  const { data: tasks, isLoading, refetch } = trpc.gamification.tasks.useQuery();
  const { data: pointsBalance } = trpc.gamification.points.useQuery();
  
  // Mutations
  const completeTaskMutation = trpc.gamification.completeTask.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`+${result.pointsAwarded} баллов!`, {
          description: result.message,
        });
        refetch();
      } else {
        toast.error(result.message);
      }
      setCompletingTask(null);
    },
    onError: (error) => {
      toast.error('Ошибка выполнения задания');
      setCompletingTask(null);
    },
  });
  
  const dailyLoginMutation = trpc.gamification.dailyLogin.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`+${result.pointsAwarded} баллов!`, {
          description: 'Ежедневный бонус получен!',
        });
        refetch();
      } else {
        toast.info(result.message);
      }
    },
  });

  const handleCompleteTask = async (taskSlug: string, taskType: string) => {
    haptic.impact('medium');
    setCompletingTask(taskSlug);
    
    // Special handling for different task types
    if (taskType === 'link_telegram') {
      // Telegram is already linked if user is in TWA
      completeTaskMutation.mutate({ taskSlug });
    } else if (taskType === 'link_email') {
      // Navigate to email linking page
      navigate('/profile/link-email');
      setCompletingTask(null);
    } else if (taskType === 'daily_login') {
      dailyLoginMutation.mutate();
      setCompletingTask(null);
    } else {
      // For other tasks, just try to complete
      completeTaskMutation.mutate({ taskSlug });
    }
  };

  // Calculate stats
  const completedTasks = tasks?.filter(t => t.isCompleted).length || 0;
  const totalTasks = tasks?.length || 0;
  const totalPointsEarned = tasks?.reduce((sum, t) => sum + (t.pointsAwarded || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => haptic.selection()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold">Задания</h1>
            <p className="text-xs text-muted-foreground">Выполняйте задания и получайте баллы</p>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Star className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-amber-700 dark:text-amber-300">
              {pointsBalance?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-espresso via-espresso/95 to-espresso/90 p-4"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-caramel rounded-full blur-2xl" />
            <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white rounded-full blur-xl" />
          </div>
          
          <div className="relative grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-caramel" />
              </div>
              <p className="font-display text-2xl font-bold text-white">{completedTasks}</p>
              <p className="text-xs text-white/60">Выполнено</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gift className="w-4 h-4 text-caramel" />
              </div>
              <p className="font-display text-2xl font-bold text-white">{totalTasks}</p>
              <p className="text-xs text-white/60">Всего</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Sparkles className="w-4 h-4 text-caramel" />
              </div>
              <p className="font-display text-2xl font-bold text-caramel">{totalPointsEarned.toLocaleString()}</p>
              <p className="text-xs text-white/60">Заработано</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tasks List */}
      <main className="px-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : tasks && tasks.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => {
              const Icon = getTaskIcon(task.iconName || undefined);
              const isCompleting = completingTask === task.slug;
              const canComplete = !task.isCompleted || task.isRepeatable;
              const progress = task.requiredValue && task.requiredValue > 1 
                ? Math.min(100, (task.currentProgress / task.requiredValue) * 100)
                : task.isCompleted ? 100 : 0;
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "p-4 transition-all",
                    task.isCompleted && !task.isRepeatable && "opacity-60"
                  )}>
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        task.isCompleted 
                          ? "bg-green-100 dark:bg-green-900/50" 
                          : "bg-amber-100 dark:bg-amber-900/50"
                      )}>
                        {task.isCompleted && !task.isRepeatable ? (
                          <Check className="w-6 h-6 text-green-600" />
                        ) : (
                          <Icon className={cn(
                            "w-6 h-6",
                            task.isCompleted ? "text-green-600" : "text-amber-600"
                          )} />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {task.titleRu || task.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {task.descriptionRu || task.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 shrink-0">
                            <Star className="w-3 h-3 text-amber-600" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                              +{task.pointsReward}
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress bar for multi-step tasks */}
                        {task.requiredValue && task.requiredValue > 1 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Прогресс</span>
                              <span>{task.currentProgress} / {task.requiredValue}</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className={cn(
                                  "h-full rounded-full",
                                  task.isCompleted ? "bg-green-500" : "bg-amber-500"
                                )}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Action button */}
                        {canComplete && (
                          <Button
                            variant={task.isCompleted ? "outline" : "default"}
                            size="sm"
                            className={cn(
                              "mt-3",
                              !task.isCompleted && "bg-amber-600 hover:bg-amber-700"
                            )}
                            onClick={() => handleCompleteTask(task.slug, task.taskType)}
                            disabled={isCompleting}
                          >
                            {isCompleting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Выполнение...
                              </>
                            ) : task.isCompleted && task.isRepeatable ? (
                              <>
                                <Zap className="w-4 h-4 mr-1" />
                                Повторить
                              </>
                            ) : task.taskType === 'link_email' ? (
                              <>
                                <Mail className="w-4 h-4 mr-1" />
                                Добавить Email
                              </>
                            ) : task.taskType === 'link_telegram' ? (
                              <>
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Получить баллы
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-1" />
                                Выполнить
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* Completed badge */}
                        {task.isCompleted && !task.isRepeatable && (
                          <div className="flex items-center gap-1 mt-3 text-green-600">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Выполнено</span>
                            {task.pointsAwarded > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (+{task.pointsAwarded} баллов)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <Card className="p-8 text-center">
            <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold text-foreground">Нет доступных заданий</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Новые задания скоро появятся
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
