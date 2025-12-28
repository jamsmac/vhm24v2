/**
 * VendHub TWA - Promotions Page
 * Shows all active promo offers and discounts on drinks
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useCartStore } from "@/stores/cartStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { 
  ArrowLeft, 
  Percent, 
  Clock, 
  Gift, 
  Sparkles, 
  Coffee, 
  Heart,
  ShoppingCart,
  Tag,
  Zap,
  Calendar,
  Star,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Promo types
type PromoType = 'discount' | 'combo' | 'bonus' | 'happy_hour' | 'new' | 'limited';

interface Promotion {
  id: string;
  type: PromoType;
  title: string;
  description: string;
  discount?: number; // percentage
  originalPrice?: number;
  promoPrice?: number;
  bonusPoints?: number;
  validUntil: string;
  code?: string;
  image?: string;
  drinks?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
  conditions?: string[];
  isActive: boolean;
  badge?: string;
}

// Mock promotions data
const mockPromotions: Promotion[] = [
  {
    id: "promo1",
    type: "discount",
    title: "Скидка 20% на всё меню",
    description: "Используйте промокод COFFEE20 и получите скидку 20% на любой напиток!",
    discount: 20,
    validUntil: "2025-01-15",
    code: "COFFEE20",
    isActive: true,
    badge: "Популярное",
    conditions: [
      "Действует на все напитки",
      "Не суммируется с другими акциями",
      "Один раз на заказ"
    ]
  },
  {
    id: "promo2",
    type: "combo",
    title: "Комбо: Капучино + Круассан",
    description: "Любимое сочетание по специальной цене! Экономия 15 000 сум.",
    originalPrice: 45000,
    promoPrice: 30000,
    validUntil: "2025-01-31",
    isActive: true,
    badge: "Выгодно",
    drinks: [
      { id: "cappuccino", name: "Капучино", price: 28000, image: "/images/cappuccino-card.png" },
    ],
    conditions: [
      "Включает капучино 300мл",
      "Включает свежий круассан",
      "Доступно во всех автоматах"
    ]
  },
  {
    id: "promo3",
    type: "happy_hour",
    title: "Happy Hour: -30%",
    description: "Каждый день с 14:00 до 16:00 скидка 30% на все холодные напитки!",
    discount: 30,
    validUntil: "2025-02-28",
    isActive: true,
    badge: "Ежедневно",
    conditions: [
      "Только с 14:00 до 16:00",
      "Только холодные напитки",
      "Автоматически применяется"
    ]
  },
  {
    id: "promo4",
    type: "bonus",
    title: "x2 бонусов за первый заказ",
    description: "Новые пользователи получают двойные бонусы за первые 3 заказа!",
    bonusPoints: 2,
    validUntil: "2025-12-31",
    code: "WELCOME",
    isActive: true,
    badge: "Новичкам",
    conditions: [
      "Для новых пользователей",
      "Действует на первые 3 заказа",
      "Бонусы начисляются автоматически"
    ]
  },
  {
    id: "promo5",
    type: "new",
    title: "Новинка: Раф Лаванда",
    description: "Попробуйте наш новый фирменный напиток со вкусом лаванды и ванили!",
    originalPrice: 35000,
    promoPrice: 28000,
    validUntil: "2025-01-20",
    isActive: true,
    badge: "Новинка",
    drinks: [
      { id: "raf_lavender", name: "Раф Лаванда", price: 28000, image: "/images/hero-coffee.png" },
    ],
    conditions: [
      "Специальная цена при запуске",
      "Ограниченное количество",
      "Доступно в избранных автоматах"
    ]
  },
  {
    id: "promo6",
    type: "limited",
    title: "Зимний сезон: Пряный Латте",
    description: "Согревающий латте с корицей, имбирём и мускатным орехом. Только зимой!",
    originalPrice: 32000,
    promoPrice: 25000,
    validUntil: "2025-02-28",
    isActive: true,
    badge: "Сезонное",
    drinks: [
      { id: "spicy_latte", name: "Пряный Латте", price: 25000, image: "/images/espresso-card.png" },
    ],
    conditions: [
      "Сезонное предложение",
      "Доступно до конца февраля",
      "Идеально для холодной погоды"
    ]
  }
];

// Get promo type icon and color
const getPromoStyle = (type: PromoType) => {
  switch (type) {
    case 'discount':
      return { icon: Percent, color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50' };
    case 'combo':
      return { icon: Gift, color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-50' };
    case 'bonus':
      return { icon: Star, color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' };
    case 'happy_hour':
      return { icon: Clock, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' };
    case 'new':
      return { icon: Sparkles, color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50' };
    case 'limited':
      return { icon: Zap, color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50' };
    default:
      return { icon: Tag, color: 'bg-gray-500', textColor: 'text-gray-600', bgLight: 'bg-gray-50' };
  }
};

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

// Calculate days remaining
const getDaysRemaining = (dateStr: string) => {
  const now = new Date();
  const end = new Date(dateStr);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

export default function Promotions() {
  const [, navigate] = useLocation();
  const { haptic } = useTelegram();
  const addToCart = useCartStore((state) => state.addItem);
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [filter, setFilter] = useState<PromoType | 'all'>('all');

  const filteredPromotions = filter === 'all' 
    ? mockPromotions.filter(p => p.isActive)
    : mockPromotions.filter(p => p.isActive && p.type === filter);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    haptic.notification('success');
    toast.success(`Промокод ${code} скопирован!`);
  };

  const handleAddDrinkToCart = (drink: { id: string; name: string; price: number; image: string }) => {
    haptic.impact('medium');
    // Navigate to locations to select machine first
    toast.success(`${drink.name} — выберите автомат для заказа`);
    navigate('/locations?drink=' + drink.id);
  };

  const filters: Array<{ type: PromoType | 'all'; label: string; icon: React.ElementType }> = [
    { type: 'all', label: 'Все', icon: Tag },
    { type: 'discount', label: 'Скидки', icon: Percent },
    { type: 'combo', label: 'Комбо', icon: Gift },
    { type: 'happy_hour', label: 'Happy Hour', icon: Clock },
    { type: 'bonus', label: 'Бонусы', icon: Star },
    { type: 'new', label: 'Новинки', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-espresso/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button 
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
                onClick={() => haptic.impact('light')}
              >
                <ArrowLeft className="w-5 h-5 text-espresso" />
              </button>
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold text-espresso">Акции</h1>
              <p className="text-xs text-muted-foreground">{filteredPromotions.length} активных предложений</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-caramel to-espresso flex items-center justify-center">
            <Percent className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {filters.map((f) => {
              const Icon = f.icon;
              const isActive = filter === f.type;
              return (
                <button
                  key={f.type}
                  onClick={() => {
                    haptic.impact('light');
                    setFilter(f.type);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-espresso text-white'
                      : 'bg-white text-espresso border border-espresso/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Promotions List */}
      <main className="px-4 py-4 space-y-4">
        {filteredPromotions.length === 0 ? (
          <div className="text-center py-12">
            <Percent className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет активных акций в этой категории</p>
          </div>
        ) : (
          filteredPromotions.map((promo, index) => {
            const style = getPromoStyle(promo.type);
            const Icon = style.icon;
            const daysLeft = getDaysRemaining(promo.validUntil);

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPromo(selectedPromo?.id === promo.id ? null : promo)}
                >
                  {/* Header with gradient */}
                  <div className={`${style.color} p-4 relative overflow-hidden`}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white" />
                      <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white" />
                    </div>
                    
                    <div className="relative flex items-start justify-between">
                      <div className="flex-1">
                        {promo.badge && (
                          <span className="inline-block px-2 py-0.5 bg-white/20 text-white text-xs font-medium rounded-full mb-2">
                            {promo.badge}
                          </span>
                        )}
                        <h3 className="font-display text-lg font-bold text-white leading-tight">
                          {promo.title}
                        </h3>
                        {promo.discount && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-3xl font-bold text-white">-{promo.discount}%</span>
                          </div>
                        )}
                        {promo.promoPrice && promo.originalPrice && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">
                              {promo.promoPrice.toLocaleString()} сум
                            </span>
                            <span className="text-sm text-white/70 line-through">
                              {promo.originalPrice.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {promo.bonusPoints && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-3xl font-bold text-white">x{promo.bonusPoints}</span>
                            <span className="text-white/90">бонусов</span>
                          </div>
                        )}
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      {promo.description}
                    </p>

                    {/* Promo Code */}
                    {promo.code && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(promo.code!);
                        }}
                        className={`w-full mb-3 p-3 rounded-xl ${style.bgLight} border-2 border-dashed ${style.textColor.replace('text', 'border')} flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className={`w-5 h-5 ${style.textColor}`} />
                          <span className={`font-mono font-bold ${style.textColor}`}>{promo.code}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Нажмите чтобы скопировать</span>
                      </button>
                    )}

                    {/* Drinks in promo */}
                    {promo.drinks && promo.drinks.length > 0 && (
                      <div className="mb-3">
                        {promo.drinks.map((drink) => (
                          <div 
                            key={drink.id}
                            className="flex items-center gap-3 p-2 rounded-xl bg-muted/50"
                          >
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-caramel/20 to-espresso/20 flex items-center justify-center overflow-hidden">
                              <Coffee className="w-6 h-6 text-espresso" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{drink.name}</p>
                              <p className="text-sm text-caramel font-semibold">
                                {drink.price.toLocaleString()} сум
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-espresso hover:bg-espresso/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddDrinkToCart(drink);
                              }}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expanded conditions */}
                    {selectedPromo?.id === promo.id && promo.conditions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 p-3 rounded-xl bg-muted/50"
                      >
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Условия акции:</p>
                        <ul className="space-y-1">
                          {promo.conditions.map((condition, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-caramel mt-1">•</span>
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>До {formatDate(promo.validUntil)}</span>
                        {daysLeft <= 7 && daysLeft > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                            {daysLeft} дн.
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
                        selectedPromo?.id === promo.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-20 left-4 right-4">
        <Card className="p-4 bg-gradient-to-r from-espresso to-espresso/90 border-0 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Есть промокод?</p>
                <p className="text-white/70 text-sm">Введите его в корзине</p>
              </div>
            </div>
            <Link href="/cart">
              <Button 
                variant="secondary" 
                className="bg-white text-espresso hover:bg-white/90"
                onClick={() => haptic.impact('light')}
              >
                В корзину
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
