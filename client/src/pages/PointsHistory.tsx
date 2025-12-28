/**
 * VendHub TWA - Points History Page
 * "Warm Brew" Design System
 * 
 * Features:
 * - Full transaction history with filtering
 * - Visual indicators for credits/debits
 * - Current balance display
 * - Transaction type icons
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTelegram } from "@/contexts/TelegramContext";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Gift, 
  ShoppingBag, 
  Users, 
  CheckCircle2,
  Settings,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.abs(price));
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

type FilterType = 'all' | 'earned' | 'spent';

interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  referenceType?: string | null;
  referenceId?: number | null;
  balanceAfter: number;
  description?: string | null;
  createdAt: string | Date;
}

// Get icon and color based on transaction type
function getTransactionStyle(type: string, amount: number) {
  const isCredit = amount > 0;
  
  const typeStyles: Record<string, { icon: React.ReactNode; label: string; bgColor: string }> = {
    task_completion: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: 'Выполнение задания',
      bgColor: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    order_reward: {
      icon: <Gift className="w-5 h-5" />,
      label: 'Кэшбэк за заказ',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
    referral_bonus: {
      icon: <Users className="w-5 h-5" />,
      label: 'Реферальный бонус',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    admin_adjustment: {
      icon: <Settings className="w-5 h-5" />,
      label: 'Корректировка',
      bgColor: isCredit 
        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    },
    redemption: {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: 'Оплата баллами',
      bgColor: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    },
    expiration: {
      icon: <Clock className="w-5 h-5" />,
      label: 'Истечение срока',
      bgColor: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    },
    reward_claim: {
      icon: <Sparkles className="w-5 h-5" />,
      label: 'Получение награды',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    },
  };

  return typeStyles[type] || {
    icon: <Coins className="w-5 h-5" />,
    label: isCredit ? 'Начисление' : 'Списание',
    bgColor: isCredit 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  };
}

// Group transactions by date
function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  
  transactions.forEach(tx => {
    const dateKey = formatDate(tx.createdAt);
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, tx]);
  });
  
  return groups;
}

export default function PointsHistory() {
  const [, navigate] = useLocation();
  const { haptic } = useTelegram();
  const [filter, setFilter] = useState<FilterType>('all');

  // Telegram BackButton
  useTelegramBackButton({
    isVisible: true,
    onClick: () => navigate('/profile'),
  });

  // Fetch points balance
  const { data: pointsBalance = 0, isLoading: isBalanceLoading } = trpc.gamification.points.useQuery();

  // Fetch points history
  const { data: history = [], isLoading: isHistoryLoading } = trpc.gamification.pointsHistory.useQuery({ 
    limit: 100 
  });

  // Filter transactions
  const filteredHistory = history.filter((tx: Transaction) => {
    if (filter === 'earned') return tx.amount > 0;
    if (filter === 'spent') return tx.amount < 0;
    return true;
  });

  // Group by date
  const groupedHistory = groupByDate(filteredHistory);

  // Calculate totals
  const totalEarned = history
    .filter((tx: Transaction) => tx.amount > 0)
    .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
  
  const totalSpent = history
    .filter((tx: Transaction) => tx.amount < 0)
    .reduce((sum: number, tx: Transaction) => sum + Math.abs(tx.amount), 0);

  const filterTabs: Array<{ id: FilterType; label: string; count: number }> = [
    { id: 'all', label: 'Все', count: history.length },
    { id: 'earned', label: 'Начисления', count: history.filter((tx: Transaction) => tx.amount > 0).length },
    { id: 'spent', label: 'Списания', count: history.filter((tx: Transaction) => tx.amount < 0).length },
  ];

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-display text-xl font-bold">История баллов</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Balance Card */}
        <Card className="coffee-card overflow-hidden">
          <div className="relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent" />
            
            <div className="relative p-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Текущий баланс</p>
                  {isBalanceLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {formatPrice(pointsBalance)} <span className="text-base font-normal text-muted-foreground">баллов</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-700 dark:text-green-300">Получено</span>
                  </div>
                  {isHistoryLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      +{formatPrice(totalEarned)}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-xs text-rose-700 dark:text-rose-300">Потрачено</span>
                  </div>
                  {isHistoryLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <p className="font-semibold text-rose-700 dark:text-rose-300">
                      -{formatPrice(totalSpent)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {filterTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={filter === tab.id ? "default" : "outline"}
              size="sm"
              className={`rounded-full whitespace-nowrap ${
                filter === tab.id 
                  ? 'bg-[#5D4037] hover:bg-[#4E342E] text-white' 
                  : ''
              }`}
              onClick={() => {
                haptic.selection();
                setFilter(tab.id);
              }}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.id 
                  ? 'bg-white/20' 
                  : 'bg-muted'
              }`}>
                {tab.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Transactions List */}
        {isHistoryLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="coffee-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <Card className="coffee-card">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Coins className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {filter === 'all' ? 'История пуста' : filter === 'earned' ? 'Нет начислений' : 'Нет списаний'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' 
                  ? 'Здесь будут отображаться все операции с баллами'
                  : filter === 'earned'
                  ? 'Выполняйте задания и делайте заказы для получения баллов'
                  : 'Используйте баллы для оплаты заказов'}
              </p>
            </div>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {Array.from(groupedHistory.entries()).map(([date, transactions]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                {/* Date Header */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-sm font-medium text-muted-foreground">{date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Transactions for this date */}
                <Card className="coffee-card divide-y divide-border">
                  {transactions.map((tx, index) => {
                    const style = getTransactionStyle(tx.type, tx.amount);
                    const isCredit = tx.amount > 0;

                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bgColor}`}>
                          {style.icon}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {tx.description || style.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(tx.createdAt)} · Баланс: {formatPrice(tx.balanceAfter)}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className={`text-right ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          <div className="flex items-center gap-1 font-semibold">
                            {isCredit ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span>{isCredit ? '+' : '-'}{formatPrice(tx.amount)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Info Card */}
        <Card className="coffee-card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Как заработать баллы?</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Выполняйте задания, делайте заказы (1% кэшбэк), приглашайте друзей и получайте баллы. 
                1 балл = 1 сум при оплате заказов.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
