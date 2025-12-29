/**
 * VendHub TWA - Points History Page
 * Shows all points transactions with filtering
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Gift,
  ShoppingBag,
  Star,
  Users,
  Trophy,
  Calendar,
  Ticket,
  RefreshCw,
  Clock,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Transaction type icons and colors
const transactionConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  earn: { icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Начисление' },
  spend: { icon: TrendingDown, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Списание' },
  bonus: { icon: Gift, color: 'text-purple-500', bgColor: 'bg-purple-100', label: 'Бонус' },
  refund: { icon: RefreshCw, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Возврат' },
  expired: { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Истёк' },
};

// Source icons
const sourceIcons: Record<string, React.ElementType> = {
  order: ShoppingBag,
  welcome_bonus: Gift,
  first_order: Star,
  referral: Users,
  achievement: Trophy,
  daily_quest: Calendar,
  promo: Ticket,
  admin: Star,
  refund: RefreshCw,
};

type FilterType = 'all' | 'earn' | 'spend' | 'bonus';

export default function PointsHistoryPage() {
  const { haptic, isTelegram } = useTelegram();
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Get points history
  const { data: transactions, isLoading } = trpc.profile.pointsHistory.useQuery();
  const { data: userStats } = trpc.profile.stats.useQuery();
  
  useTelegramBackButton({
    isVisible: true,
    onClick: () => window.history.back(),
  });

  const filteredTransactions = transactions?.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'earn') return t.type === 'earn' || t.type === 'bonus';
    if (filter === 'spend') return t.type === 'spend';
    if (filter === 'bonus') return t.type === 'bonus';
    return true;
  }) || [];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (newFilter: FilterType) => {
    haptic.selection();
    setFilter(newFilter);
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
          <h1 className="font-display text-lg font-semibold">История баллов</h1>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="coffee-card overflow-hidden">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-caramel/20 to-transparent rounded-full blur-2xl" />
              
              <div className="relative text-center">
                <p className="text-sm text-muted-foreground mb-1">Текущий баланс</p>
                <h2 className="font-display text-4xl font-bold text-foreground">
                  {formatNumber(userStats?.pointsBalance || 0)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">баллов</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4"
        >
          {[
            { key: 'all', label: 'Все' },
            { key: 'earn', label: 'Начисления' },
            { key: 'spend', label: 'Списания' },
            { key: 'bonus', label: 'Бонусы' },
          ].map((item) => (
            <Button
              key={item.key}
              variant={filter === item.key ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "rounded-full whitespace-nowrap",
                filter === item.key && "bg-caramel hover:bg-caramel/90"
              )}
              onClick={() => handleFilterChange(item.key as FilterType)}
            >
              {item.label}
            </Button>
          ))}
        </motion.div>

        {/* Transactions List */}
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            [...Array(5)].map((_, i) => (
              <Card key={i} className="coffee-card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-secondary rounded mb-2" />
                    <div className="h-3 w-24 bg-secondary rounded" />
                  </div>
                  <div className="h-5 w-16 bg-secondary rounded" />
                </div>
              </Card>
            ))
          ) : filteredTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Нет транзакций</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' 
                  ? 'История баллов пока пуста'
                  : 'Нет транзакций данного типа'}
              </p>
            </motion.div>
          ) : (
            filteredTransactions.map((transaction, index) => {
              const config = transactionConfig[transaction.type] || transactionConfig.earn;
              const SourceIcon = sourceIcons[transaction.source] || Star;
              const isPositive = transaction.amount > 0;
              
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="coffee-card p-4">
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        config.bgColor
                      )}>
                        <SourceIcon className={cn("w-5 h-5", config.color)} />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {transaction.description}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      
                      {/* Amount */}
                      <div className="text-right">
                        <p className={cn(
                          "font-semibold",
                          isPositive ? "text-green-500" : "text-red-500"
                        )}>
                          {isPositive ? '+' : ''}{formatNumber(transaction.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          = {formatNumber(transaction.balanceAfter)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Info */}
        {filteredTransactions.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-xs text-muted-foreground py-4"
          >
            Показано {filteredTransactions.length} транзакций
          </motion.p>
        )}
      </main>
    </div>
  );
}
