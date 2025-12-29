/**
 * Telegram Connect Page
 * Simple page to connect Telegram bot for notifications and earn bonus
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Bell, Gift, MessageCircle, Check, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTelegram } from "@/contexts/TelegramContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const BOT_USERNAME = 'vendhubbot';
const TELEGRAM_BONUS = 15000;

export default function TelegramConnectPage() {
  const [, navigate] = useLocation();
  const { isTelegram, user: telegramUser, haptic } = useTelegram();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { data: stats, refetch: refetchStats } = trpc.profile.stats.useQuery();
  const { data: userProfile } = trpc.profile.get.useQuery();
  
  const isConnected = !!userProfile?.telegramId;
  const hasReceivedBonus = stats?.welcomeBonusReceived;

  // Generate bot link with user tracking
  const getBotLink = () => {
    const userId = userProfile?.id || '';
    return `https://t.me/${BOT_USERNAME}?start=connect_${userId}`;
  };

  const handleConnectTelegram = () => {
    haptic?.selection();
    setIsConnecting(true);
    
    // Open Telegram bot link
    const botLink = getBotLink();
    
    if (isTelegram) {
      // Inside Telegram, use openTelegramLink
      window.Telegram?.WebApp?.openTelegramLink(botLink);
    } else {
      // Outside Telegram, open in new tab
      window.open(botLink, '_blank');
    }
    
    toast.info('Откройте бота и нажмите "Старт"', {
      description: 'После запуска бота вернитесь сюда'
    });
    
    // Reset connecting state after a delay
    setTimeout(() => setIsConnecting(false), 3000);
  };

  const benefits = [
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Уведомления о заказах',
      description: 'Статус заказа в реальном времени'
    },
    {
      icon: <Gift className="w-5 h-5" />,
      title: 'Персональные акции',
      description: 'Эксклюзивные предложения только для вас'
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: 'Бонусы и баллы',
      description: 'Уведомления о начислении баллов'
    },
  ];

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
        <h1 className="font-display text-xl font-bold">Telegram уведомления</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-sky-500 to-blue-600 text-white p-6 rounded-2xl">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            
            <div className="relative text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </div>
              
              <h2 className="font-display text-2xl font-bold mb-2">
                {isConnected ? 'Telegram подключён!' : 'Подключите Telegram'}
              </h2>
              
              {!isConnected && !hasReceivedBonus && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-4">
                  <Gift className="w-4 h-4" />
                  <span className="font-semibold">+{TELEGRAM_BONUS.toLocaleString('ru-RU')} баллов</span>
                </div>
              )}
              
              <p className="text-white/80 text-sm">
                {isConnected 
                  ? 'Вы будете получать уведомления о заказах и акциях'
                  : 'Получайте уведомления о заказах, акциях и бонусах прямо в Telegram'}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Connection Status */}
        {isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">Telegram подключён</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    @{userProfile?.telegramUsername || 'пользователь'}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={handleConnectTelegram}
              disabled={isConnecting}
              className="w-full h-14 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-lg font-semibold"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Открываем бота...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Открыть @{BOT_USERNAME}
                </span>
              )}
            </Button>
          </motion.div>
        )}

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-foreground mb-3">Что вы получите</h3>
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-4 bg-card border border-border rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{benefit.title}</p>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Bonus Info */}
        {!hasReceivedBonus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    Бонус за подключение
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Получите <span className="font-bold">{TELEGRAM_BONUS.toLocaleString('ru-RU')} баллов</span> — это бесплатный эспрессо! ☕
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold text-foreground mb-3">Как подключить</h3>
          <Card className="p-4 bg-card border border-border rounded-xl">
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span className="text-sm text-foreground">Нажмите кнопку "Открыть @{BOT_USERNAME}"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span className="text-sm text-foreground">В открывшемся боте нажмите "Старт" или "/start"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">3</span>
                <span className="text-sm text-foreground">Готово! Вы будете получать уведомления в Telegram</span>
              </li>
            </ol>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
