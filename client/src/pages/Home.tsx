/**
 * VendHub TWA - Modern Home Page
 * Clean, modern design with VendHub branding
 * Quick access to catalog and locations at the top
 * 
 * Dark Theme Support: All elements use theme-aware colors
 * User Customization: Sections can be reordered, hidden, and resized
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useUserStore, formatPoints } from "@/stores/userStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCartStore } from "@/stores/cartStore";
import { useOrderHistoryStore } from "@/stores/orderHistoryStore";
import Recommendations from "@/components/Recommendations";
import { Gift, ChevronRight, Sparkles, Bell, Clock, TrendingUp, Coffee, MapPin, QrCode, Percent, Loader2, Navigation, Map } from "lucide-react";
import NotificationCenter from "@/components/NotificationCenter";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Section configuration interface
interface SectionConfig {
  id: string;
  visible: boolean;
  size: 'compact' | 'normal' | 'large';
  order: number;
}

// Default section order and visibility
// Order: 1. Bonus card, 2. Promo/QR, 3. Catalog/Machines, 4. Stats, 5. Recommendations, 6. Popular
const defaultSections: SectionConfig[] = [
  { id: 'bonus_card', visible: true, size: 'normal', order: 1 },
  { id: 'secondary_actions', visible: true, size: 'normal', order: 2 },
  { id: 'quick_actions', visible: true, size: 'normal', order: 3 },
  { id: 'nearby_machines', visible: true, size: 'normal', order: 4 },
  { id: 'stats', visible: true, size: 'normal', order: 5 },
  { id: 'recommendations', visible: true, size: 'normal', order: 6 },
  { id: 'promo_banner', visible: true, size: 'normal', order: 7 },
  { id: 'popular', visible: true, size: 'normal', order: 8 },
];

// Mock user data for demo
const mockUser = {
  firstName: "Jamshid",
  pointsBalance: 25000,
  level: "silver" as const,
};

// Default coordinates for Tashkent (fallback)
const DEFAULT_LAT = 41.2995;
const DEFAULT_LNG = 69.2401;

export default function Home() {
  const { user: telegramUser, haptic } = useTelegram();
  const { profile, loyalty } = useUserStore();
  const { favorites } = useFavoritesStore();
  const { items: cartItems } = useCartStore();
  const { getOrderStats, getCompletedOrders } = useOrderHistoryStore();
  const { unreadCount } = useNotificationsStore();
  const [, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Request geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          setLocationError(error.message);
          // Use default Tashkent coordinates as fallback
          setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationError('Geolocation not supported');
      setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    }
  }, []);
  
  // Fetch nearby machines based on user location
  const { data: nearbyMachinesData, isLoading: machinesLoading } = trpc.machines.nearby.useQuery(
    {
      latitude: userLocation?.lat ?? DEFAULT_LAT,
      longitude: userLocation?.lng ?? DEFAULT_LNG,
      limit: 5,
      maxDistanceKm: 50
    },
    {
      enabled: !!userLocation,
      staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    }
  );
  
  // Fetch user preferences
  const { data: preferences, isLoading: prefsLoading } = trpc.gamification.getPreferences.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  const displayName = telegramUser?.first_name || profile?.firstName || mockUser.firstName;
  const points = loyalty?.pointsBalance || mockUser.pointsBalance;
  const orderStats = getOrderStats();
  const hasOrderHistory = getCompletedOrders().length > 0;

  // Merge saved preferences with defaults
  const sections = useMemo(() => {
    if (!preferences?.homeSections) return defaultSections;
    
    const savedSections = preferences.homeSections as SectionConfig[];
    return defaultSections.map(defaultSection => {
      const saved = savedSections.find(s => s.id === defaultSection.id);
      if (saved) {
        return {
          ...defaultSection,
          visible: saved.visible ?? defaultSection.visible,
          size: saved.size ?? defaultSection.size,
          order: saved.order ?? defaultSection.order,
        };
      }
      return defaultSection;
    }).sort((a, b) => a.order - b.order);
  }, [preferences]);

  const handleRecommendationClick = (itemId: string) => {
    haptic.selection();
    navigate(`/drink/${itemId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  // Get section by ID
  const getSection = (id: string) => sections.find(s => s.id === id);
  const isSectionVisible = (id: string) => getSection(id)?.visible !== false;
  const getSectionSize = (id: string) => getSection(id)?.size || 'normal';

  // Section components
  const QuickActionsSection = ({ size }: { size: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="grid grid-cols-2 gap-3"
    >
      {/* Catalog Button */}
      <Card 
        className={cn(
          "border-2 border-amber-700/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-700/5 to-amber-700/10 dark:from-amber-600/10 dark:to-amber-600/20 rounded-2xl cursor-pointer hover:border-amber-700/40 dark:hover:border-amber-500/50 hover:shadow-lg transition-all active:scale-[0.98]",
          size === 'compact' ? 'p-3' : size === 'large' ? 'p-5' : 'p-4'
        )}
        onClick={() => {
          haptic.selection();
          navigate('/menu/1');
        }}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className={cn(
            "rounded-2xl bg-amber-700 dark:bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-700/30 dark:shadow-amber-600/30",
            size === 'compact' ? 'w-10 h-10' : size === 'large' ? 'w-16 h-16' : 'w-14 h-14'
          )}>
            <Coffee className={cn(size === 'compact' ? 'w-5 h-5' : size === 'large' ? 'w-8 h-8' : 'w-7 h-7', "text-white")} />
          </div>
          <div>
            <h3 className={cn("font-display font-bold text-foreground", size === 'large' && 'text-lg')}>Каталог</h3>
            <p className="text-xs text-muted-foreground">Все напитки</p>
          </div>
        </div>
      </Card>

      {/* Locations Button */}
      <Card 
        className={cn(
          "border-2 border-amber-500/20 dark:border-amber-400/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-500/10 dark:to-amber-500/20 rounded-2xl cursor-pointer hover:border-amber-500/40 dark:hover:border-amber-400/50 hover:shadow-lg transition-all active:scale-[0.98]",
          size === 'compact' ? 'p-3' : size === 'large' ? 'p-5' : 'p-4'
        )}
        onClick={() => {
          haptic.selection();
          navigate('/locations');
        }}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className={cn(
            "rounded-2xl bg-amber-500 dark:bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30",
            size === 'compact' ? 'w-10 h-10' : size === 'large' ? 'w-16 h-16' : 'w-14 h-14'
          )}>
            <MapPin className={cn(size === 'compact' ? 'w-5 h-5' : size === 'large' ? 'w-8 h-8' : 'w-7 h-7', "text-white")} />
          </div>
          <div>
            <h3 className={cn("font-display font-bold text-foreground", size === 'large' && 'text-lg')}>Автоматы</h3>
            <p className="text-xs text-muted-foreground">Найти рядом</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  // Format distance for display
  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} м`;
    }
    return `${distanceKm.toFixed(1)} км`;
  };
  
  // Format walk time for display
  const formatWalkTime = (minutes: number): string => {
    if (minutes < 1) return '< 1 мин';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
    }
    return `${minutes} мин`;
  };

  const NearbyMachinesSection = ({ size }: { size: string }) => {
    // Use real data from API or fallback to empty array
    const machines = nearbyMachinesData || [];
    const displayCount = size === 'compact' ? 2 : 3;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-display font-semibold text-foreground">Автоматы рядом</h3>
            {locationError && (
              <span className="text-xs text-muted-foreground">(примерно)</span>
            )}
          </div>
          <Link href="/locations">
            <Button variant="ghost" size="sm" className="text-muted-foreground h-8 gap-1">
              <Map className="w-4 h-4" />
              Карта
            </Button>
          </Link>
        </div>
        
        <div className="space-y-2">
          {machinesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Поиск автоматов...</span>
            </div>
          ) : machines.length === 0 ? (
            <Card className="p-4 text-center">
              <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Автоматы не найдены поблизости</p>
              <Link href="/locations">
                <Button variant="link" size="sm" className="mt-2">
                  Посмотреть все на карте
                </Button>
              </Link>
            </Card>
          ) : (
            machines.slice(0, displayCount).map((machine, index) => {
              const isAvailable = machine.status === 'online';
              return (
                <motion.div
                  key={machine.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all active:scale-[0.98]",
                      isAvailable 
                        ? "bg-card border border-border hover:border-green-500/50 hover:shadow-md" 
                        : "bg-muted/50 border border-border opacity-60",
                      size === 'compact' ? 'p-2' : 'p-3'
                    )}
                    onClick={() => {
                      if (isAvailable) {
                        haptic.selection();
                        navigate(`/menu/${machine.machineCode}`);
                      } else {
                        haptic.notification('error');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "rounded-xl flex items-center justify-center",
                          isAvailable 
                            ? "bg-gradient-to-br from-amber-700 to-amber-800" 
                            : "bg-muted",
                          size === 'compact' ? 'w-10 h-10' : 'w-12 h-12'
                        )}>
                          <Coffee className={cn(
                            size === 'compact' ? 'w-5 h-5' : 'w-6 h-6',
                            isAvailable ? 'text-white' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-foreground">{machine.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Navigation className="w-3 h-3" />
                              {formatDistance(machine.distance)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {formatWalkTime(machine.walkTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          isAvailable 
                            ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400" 
                            : machine.status === 'maintenance'
                              ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400"
                              : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400"
                        )}>
                          {isAvailable ? 'Доступен' : machine.status === 'maintenance' ? 'Обслуживание' : 'Недоступен'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
        
        {/* View all button */}
        {machines.length > 0 && (
          <Link href="/locations">
            <Button 
              variant="outline" 
              className="w-full mt-3 border-dashed border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={() => haptic.selection()}
            >
              <Map className="w-4 h-4 mr-2" />
              Показать все на карте
            </Button>
          </Link>
        )}
      </motion.div>
    );
  };

  const SecondaryActionsSection = ({ size }: { size: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 gap-3"
    >
      {/* QR Scan */}
      <Card 
        className={cn(
          "bg-card border border-border rounded-xl cursor-pointer hover:bg-secondary/70 transition-colors active:scale-[0.98]",
          size === 'compact' ? 'p-2' : 'p-3'
        )}
        onClick={() => {
          haptic.selection();
          navigate('/scan');
        }}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center",
            size === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
          )}>
            <QrCode className={cn(size === 'compact' ? 'w-4 h-4' : 'w-5 h-5', "text-blue-600 dark:text-blue-400")} />
          </div>
          <div>
            <h4 className="font-medium text-sm text-foreground">QR Скан</h4>
            {size !== 'compact' && <p className="text-xs text-muted-foreground">Быстрый заказ</p>}
          </div>
        </div>
      </Card>

      {/* Promotions */}
      <Card 
        className={cn(
          "bg-card border border-border rounded-xl cursor-pointer hover:bg-secondary/70 transition-colors active:scale-[0.98]",
          size === 'compact' ? 'p-2' : 'p-3'
        )}
        onClick={() => {
          haptic.selection();
          navigate('/promotions');
        }}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center",
            size === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
          )}>
            <Percent className={cn(size === 'compact' ? 'w-4 h-4' : 'w-5 h-5', "text-red-600 dark:text-red-400")} />
          </div>
          <div>
            <h4 className="font-medium text-sm text-foreground">Акции</h4>
            {size !== 'compact' && <p className="text-xs text-muted-foreground">3 активных</p>}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const BonusCardSection = ({ size }: { size: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Link href="/profile/bonuses">
        <Card className={cn(
          "relative overflow-hidden border-0 bg-gradient-to-br from-amber-800 via-amber-800/95 to-amber-900 text-white rounded-2xl shadow-lg shadow-amber-900/20",
          size === 'compact' ? 'p-3' : size === 'large' ? 'p-5' : 'p-4'
        )}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs mb-0.5">Бонусный баланс</p>
              <p className={cn("font-display font-bold", size === 'large' ? 'text-3xl' : 'text-2xl')}>
                {formatPoints(points)}
                <span className="text-sm font-normal text-white/60 ml-1">UZS</span>
              </p>
            </div>
            
            {size !== 'compact' && (
              <div className="flex items-center gap-3">
                {/* Level badge */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium">Silver</span>
                  </div>
                  <p className="text-xs text-white/50">До Gold: 5</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );

  const StatsSection = ({ size }: { size: string }) => {
    if (!hasOrderHistory) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className={cn("text-center bg-card border border-border rounded-xl", size === 'compact' ? 'p-2' : 'p-3')}>
          <div className={cn(
            "mx-auto mb-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center",
            size === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
          )}>
            <TrendingUp className={cn(size === 'compact' ? 'w-3 h-3' : 'w-4 h-4', "text-blue-600 dark:text-blue-400")} />
          </div>
          <p className="font-display font-bold text-foreground">{orderStats.totalOrders}</p>
          <p className="text-xs text-muted-foreground">Заказов</p>
        </Card>
        <Card className={cn("text-center bg-card border border-border rounded-xl", size === 'compact' ? 'p-2' : 'p-3')}>
          <div className={cn(
            "mx-auto mb-1.5 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center",
            size === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
          )}>
            <span className={cn(size === 'compact' ? 'text-xs' : 'text-sm', "text-green-600 dark:text-green-400 font-bold")}>₿</span>
          </div>
          <p className="font-display font-bold text-foreground">{formatPrice(orderStats.totalSpent)}</p>
          <p className="text-xs text-muted-foreground">Потрачено</p>
        </Card>
        <Card className={cn("text-center bg-card border border-border rounded-xl", size === 'compact' ? 'p-2' : 'p-3')}>
          <div className={cn(
            "mx-auto mb-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center",
            size === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
          )}>
            <Clock className={cn(size === 'compact' ? 'w-3 h-3' : 'w-4 h-4', "text-orange-600 dark:text-orange-400")} />
          </div>
          <p className="font-display font-bold text-foreground">2.5</p>
          <p className="text-xs text-muted-foreground">мин</p>
        </Card>
      </motion.div>
    );
  };

  const RecommendationsSection = ({ size }: { size: string }) => {
    if (!hasOrderHistory) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Recommendations
          title="Рекомендуем для вас"
          limit={size === 'compact' ? 3 : size === 'large' ? 8 : 5}
          excludeIds={[]}
          showReason={size !== 'compact'}
          variant="horizontal"
          onItemClick={handleRecommendationClick}
        />
      </motion.div>
    );
  };

  const PromoBannerSection = ({ size }: { size: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className={cn(
        "relative overflow-hidden border-0 bg-gradient-to-r from-amber-500/90 to-amber-500 rounded-2xl",
        size === 'compact' ? 'p-3' : 'p-4'
      )}>
        <div className="absolute -right-4 -bottom-4 w-20 h-20 opacity-20">
          <img src="/images/espresso-card.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium mb-1">
              Акция
            </span>
            <h3 className={cn("font-display font-bold text-white", size === 'large' ? 'text-lg' : 'text-base')}>
              Второй кофе -50%
            </h3>
            {size !== 'compact' && (
              <p className="text-white/80 text-xs">
                При заказе от 30 000 UZS
              </p>
            )}
          </div>
          <Button 
            size="sm" 
            className="bg-white text-amber-800 hover:bg-white/90 rounded-xl h-9"
            onClick={() => {
              haptic.selection();
              navigate('/locations');
            }}
          >
            Заказать
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  const PopularSection = ({ size }: { size: string }) => {
    const itemCount = size === 'compact' ? 2 : size === 'large' ? 6 : 4;
    const items = [
      { id: 'cappuccino', name: 'Капучино', price: 20000, image: '/images/cappuccino-card.png' },
      { id: 'latte', name: 'Латте', price: 22000, image: '/images/cappuccino-card.png' },
      { id: 'americano', name: 'Американо', price: 15000, image: '/images/americano-card.png' },
      { id: 'espresso', name: 'Эспрессо', price: 12000, image: '/images/espresso-card.png' },
      { id: 'mocha', name: 'Мокка', price: 25000, image: '/images/cappuccino-card.png' },
      { id: 'flatwhite', name: 'Флэт Уайт', price: 24000, image: '/images/cappuccino-card.png' },
    ].slice(0, itemCount);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground">Популярное</h3>
          <Link href="/menu/1">
            <Button variant="ghost" size="sm" className="text-muted-foreground h-8">
              Все
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className={cn("grid gap-3", size === 'large' ? 'grid-cols-3' : 'grid-cols-2')}>
          {items.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Card 
                className="overflow-hidden border border-border bg-card rounded-2xl cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.98]"
                onClick={() => {
                  haptic.selection();
                  navigate(`/drink/${item.id}`);
                }}
              >
                <div className={cn(
                  "relative bg-secondary/50 dark:bg-secondary/30",
                  size === 'compact' ? 'aspect-[4/3]' : 'aspect-square'
                )}>
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className={cn(size === 'compact' ? 'p-2' : 'p-3')}>
                  <h4 className="font-medium text-sm text-foreground">{item.name}</h4>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-1">
                    {formatPrice(item.price)} UZS
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Map section IDs to components
  const sectionComponents: Record<string, (props: { size: string }) => React.ReactNode> = {
    quick_actions: QuickActionsSection,
    nearby_machines: NearbyMachinesSection,
    secondary_actions: SecondaryActionsSection,
    bonus_card: BonusCardSection,
    stats: StatsSection,
    recommendations: RecommendationsSection,
    promo_banner: PromoBannerSection,
    popular: PopularSection,
  };

  // Render sections in order
  const renderSections = () => {
    return sections
      .filter(section => section.visible)
      .map(section => {
        const Component = sectionComponents[section.id];
        if (!Component) return null;
        return <Component key={section.id} size={section.size} />;
      });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with gradient */}
      <header className="relative overflow-hidden">
        {/* Background gradient - theme aware */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-amber-100/30 dark:via-amber-900/20 to-background" />
        
        <div className="relative px-4 pt-safe-top">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/images/vendhub-logo.png" 
                alt="VendHub" 
                className="w-11 h-11 rounded-xl"
              />
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">VendHub</h1>
                <p className="text-xs text-muted-foreground">Coffee & Snacks</p>
              </div>
            </div>
            
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full relative text-foreground"
              onClick={() => {
                haptic.selection();
                setShowNotifications(true);
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </div>

          {/* Welcome section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-4"
          >
            <p className="text-muted-foreground text-sm">{getGreeting()},</p>
            <h2 className="font-display text-2xl font-bold text-foreground">{displayName}! 👋</h2>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 space-y-4">
        {prefsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          renderSections()
        )}
      </main>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}
