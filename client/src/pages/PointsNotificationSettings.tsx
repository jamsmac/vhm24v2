/**
 * VendHub TWA - Points Notification Settings Page
 * Configure which points notifications to receive
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useTelegram } from "@/contexts/TelegramContext";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Coins,
  CheckCircle2,
  Gift,
  Users,
  Settings,
  ShoppingBag,
  Clock,
  Sparkles,
  Save,
  RotateCcw,
  Send,
  Bell,
} from "lucide-react";

// Default preferences (all enabled)
const defaultPreferences = {
  taskCompletion: true,
  orderReward: true,
  referralBonus: true,
  adminAdjustment: true,
  redemption: true,
  expiration: true,
  telegramEnabled: true,
};

type PreferenceKey = keyof typeof defaultPreferences;

interface NotificationSetting {
  key: PreferenceKey;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const notificationSettings: NotificationSetting[] = [
  {
    key: 'taskCompletion',
    icon: CheckCircle2,
    title: 'Выполнение заданий',
    description: 'Уведомления о начислении баллов за задания',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    key: 'orderReward',
    icon: Gift,
    title: 'Кэшбэк за заказы',
    description: 'Уведомления о начислении кэшбэка',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    key: 'referralBonus',
    icon: Users,
    title: 'Реферальные бонусы',
    description: 'Уведомления о бонусах за приглашение друзей',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    key: 'adminAdjustment',
    icon: Settings,
    title: 'Корректировки',
    description: 'Уведомления об изменении баланса администратором',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    key: 'redemption',
    icon: ShoppingBag,
    title: 'Оплата баллами',
    description: 'Уведомления о списании баллов при оплате',
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  },
  {
    key: 'expiration',
    icon: Clock,
    title: 'Истечение баллов',
    description: 'Уведомления о сгорании баллов',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
];

export default function PointsNotificationSettings() {
  const [, navigate] = useLocation();
  const { haptic, user } = useTelegram();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Telegram BackButton
  useTelegramBackButton({
    isVisible: true,
    onClick: () => navigate('/profile/notifications'),
  });

  // Fetch user preferences
  const { data: userPrefs, isLoading } = trpc.gamification.getPreferences.useQuery();
  
  // Update preferences mutation
  const updatePrefs = trpc.gamification.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Настройки сохранены');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Ошибка сохранения');
    },
  });

  // Load saved preferences
  useEffect(() => {
    if (userPrefs?.pointsNotifications) {
      const saved = userPrefs.pointsNotifications as typeof defaultPreferences;
      setPreferences({
        ...defaultPreferences,
        ...saved,
      });
    }
  }, [userPrefs]);

  const handleToggle = (key: PreferenceKey, value: boolean) => {
    haptic.selection();
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    haptic.impact('medium');
    updatePrefs.mutate({ pointsNotifications: preferences });
  };

  const handleReset = () => {
    haptic.impact('light');
    setPreferences(defaultPreferences);
    setHasChanges(true);
  };

  // Count only notification type settings (exclude telegramEnabled)
  const typeSettings = notificationSettings.filter(s => s.key !== 'telegramEnabled');
  const enabledCount = typeSettings.filter(s => preferences[s.key]).length;
  const allEnabled = enabledCount === typeSettings.length;

  const handleToggleAll = () => {
    haptic.impact('medium');
    const newValue = !allEnabled;
    const newPrefs = { ...preferences };
    typeSettings.forEach(s => {
      newPrefs[s.key] = newValue;
    });
    setPreferences(newPrefs);
    setHasChanges(true);
  };

  // Check if user has Telegram linked
  const hasTelegram = !!user?.id;

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile/notifications">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold">Уведомления о баллах</h1>
              <p className="text-xs text-muted-foreground">
                {enabledCount} из {typeSettings.length} включено
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Telegram Notifications Card */}
        <Card className="coffee-card overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent" />
            <div className="relative p-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      Telegram-уведомления
                      {preferences.telegramEnabled && hasTelegram && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                          Активно
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hasTelegram 
                        ? 'Получать уведомления в Telegram' 
                        : 'Откройте приложение через Telegram'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.telegramEnabled}
                  onCheckedChange={(checked) => handleToggle('telegramEnabled', checked)}
                  disabled={!hasTelegram}
                />
              </div>
              
              {!hasTelegram && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Для получения Telegram-уведомлений откройте приложение через Telegram Mini App
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="coffee-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {allEnabled ? 'Все типы включены' : enabledCount === 0 ? 'Все типы выключены' : 'Частично включены'}
                </p>
                <p className="text-xs text-muted-foreground">
                  In-app уведомления по типам
                </p>
              </div>
            </div>
            <Switch
              checked={allEnabled}
              onCheckedChange={handleToggleAll}
            />
          </div>
        </Card>

        {/* Settings List */}
        {isLoading ? (
          <Card className="coffee-card divide-y divide-border">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="w-10 h-5 rounded-full" />
              </div>
            ))}
          </Card>
        ) : (
          <Card className="coffee-card divide-y divide-border overflow-hidden">
            {notificationSettings.map((setting, index) => {
              const Icon = setting.icon;
              const isEnabled = preferences[setting.key];

              return (
                <motion.div
                  key={setting.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${setting.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{setting.title}</p>
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(setting.key, checked)}
                  />
                </motion.div>
              );
            })}
          </Card>
        )}

        {/* Info Card */}
        <Card className="coffee-card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Telegram-уведомления</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                При включении Telegram-уведомлений вы будете получать сообщения о баллах прямо в Telegram, 
                даже когда приложение закрыто.
              </p>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="coffee-card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">О баллах</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Баллы начисляются за выполнение заданий, заказы (1% кэшбэк) и приглашение друзей. 
                1 балл = 1 сум при оплате заказов.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReset}
            disabled={!hasChanges && JSON.stringify(preferences) === JSON.stringify(defaultPreferences)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Сбросить
          </Button>
          <Button
            className="flex-1 bg-[#5D4037] hover:bg-[#4E342E] text-white"
            onClick={handleSave}
            disabled={!hasChanges || updatePrefs.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updatePrefs.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </main>
    </div>
  );
}
