/**
 * VendHub TWA - Notification Settings Page
 * Manage notification preferences and subscriptions
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useTelegram } from "@/contexts/TelegramContext";
import {
  ArrowLeft,
  Bell,
  BellOff,
  BellRing,
  Gift,
  Heart,
  Package,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  Vibrate,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function NotificationSettings() {
  const { haptic } = useTelegram();
  const { settings, updateSettings } = useNotificationsStore();
  const { favorites } = useFavoritesStore();

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    haptic.impact('light');
    updateSettings({ [key]: value });
    
    if (key === 'enabled') {
      toast(value ? 'Уведомления включены' : 'Уведомления отключены', {
        icon: value ? <BellRing className="w-5 h-5 text-green-500" /> : <BellOff className="w-5 h-5 text-muted-foreground" />,
      });
    }
  };

  const settingsGroups = [
    {
      title: 'Основные',
      description: 'Управление всеми уведомлениями',
      items: [
        {
          key: 'enabled' as const,
          icon: Bell,
          title: 'Уведомления',
          description: 'Получать уведомления в приложении',
          color: 'bg-blue-100 text-blue-600',
          highlight: false,
        },
      ],
    },
    {
      title: 'Типы уведомлений',
      description: 'Выберите какие уведомления получать',
      items: [
        {
          key: 'favoritePromoNotifications' as const,
          icon: Heart,
          title: 'Акции на избранное',
          description: `Скидки на ваши ${favorites.length} избранных напитков`,
          color: 'bg-pink-100 text-pink-600',
          highlight: true,
        },
        {
          key: 'promoNotifications' as const,
          icon: Gift,
          title: 'Все акции',
          description: 'Новые промо-предложения и скидки',
          color: 'bg-red-100 text-red-600',
          highlight: false,
        },
        {
          key: 'orderStatusNotifications' as const,
          icon: Package,
          title: 'Статус заказа',
          description: 'Обновления о готовности заказа',
          color: 'bg-green-100 text-green-600',
          highlight: false,
        },
        {
          key: 'bonusNotifications' as const,
          icon: Star,
          title: 'Бонусы',
          description: 'Начисление и списание бонусов',
          color: 'bg-amber-100 text-amber-600',
          highlight: false,
        },
        {
          key: 'newProductNotifications' as const,
          icon: Sparkles,
          title: 'Новинки',
          description: 'Новые напитки в меню',
          color: 'bg-purple-100 text-purple-600',
          highlight: false,
        },
      ],
    },
    {
      title: 'Звук и вибрация',
      description: 'Настройки оповещений',
      items: [
        {
          key: 'sound' as const,
          icon: settings.sound ? Volume2 : VolumeX,
          title: 'Звук',
          description: 'Звуковое оповещение',
          color: 'bg-gray-100 text-gray-600',
          highlight: false,
        },
        {
          key: 'vibration' as const,
          icon: Vibrate,
          title: 'Вибрация',
          description: 'Вибрация при уведомлении',
          color: 'bg-gray-100 text-gray-600',
          highlight: false,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-espresso/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <button
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
                onClick={() => haptic.impact('light')}
              >
                <ArrowLeft className="w-5 h-5 text-espresso" />
              </button>
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold text-espresso">Уведомления</h1>
              <p className="text-xs text-muted-foreground">Настройки подписок</p>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            settings.enabled ? 'bg-gradient-to-br from-caramel to-espresso' : 'bg-muted'
          }`}>
            {settings.enabled ? (
              <BellRing className="w-5 h-5 text-white" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Info banner for favorites */}
        {favorites.length > 0 && settings.favoritePromoNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 bg-gradient-to-r from-pink-50 to-red-50 border-pink-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    Отслеживаем {favorites.length} напитков
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Вы получите уведомление когда на ваши избранные напитки появится скидка
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Settings groups */}
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <div className="mb-3">
              <h3 className="font-display font-semibold text-foreground">{group.title}</h3>
              <p className="text-xs text-muted-foreground">{group.description}</p>
            </div>

            <Card className="divide-y overflow-hidden">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isEnabled = settings[item.key];
                const isDisabled = item.key !== 'enabled' && !settings.enabled;

                return (
                  <div
                    key={item.key}
                    className={`p-4 flex items-center justify-between ${
                      isDisabled ? 'opacity-50' : ''
                    } ${item.highlight ? 'bg-pink-50/50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          {item.title}
                          {item.highlight && (
                            <span className="text-xs px-1.5 py-0.5 bg-pink-100 text-pink-600 rounded-full">
                              Рекомендуем
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(item.key, checked)}
                      disabled={isDisabled}
                    />
                  </div>
                );
              })}
            </Card>
          </motion.div>
        ))}

        {/* Info note */}
        <Card className="p-4 bg-muted/50 border-0">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                Уведомления отображаются в приложении. Для получения push-уведомлений 
                в Telegram включите уведомления от бота @VendHubBot.
              </p>
            </div>
          </div>
        </Card>

        {/* Test notification button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            haptic.notification('success');
            toast.success('Тестовое уведомление', {
              description: 'Уведомления работают корректно!',
            });
          }}
        >
          <BellRing className="w-4 h-4 mr-2" />
          Отправить тестовое уведомление
        </Button>
      </main>
    </div>
  );
}
