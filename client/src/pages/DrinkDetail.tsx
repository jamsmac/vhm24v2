/**
 * VendHub TWA - Drink Detail Page
 * Shows drink info with description and Order button
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { usePendingOrderStore } from "@/stores/pendingOrderStore";
import { ArrowLeft, Heart, Star, Coffee, Droplets, Flame } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Drink data (in real app this would come from API)
const drinksData: Record<string, {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  fullDescription: string;
  calories: number;
  caffeine: number;
  volume: string;
  rating: number;
  reviews: number;
  ingredients: string[];
  category: string;
}> = {
  'cappuccino': {
    id: 'cappuccino',
    name: 'Капучино',
    price: 20000,
    image: '/images/cappuccino-card.png',
    description: 'Эспрессо с молочной пенкой',
    fullDescription: 'Классический итальянский капучино — идеальное сочетание насыщенного эспрессо и нежной молочной пенки. Бархатистая текстура и богатый вкус сделают ваше утро особенным.',
    calories: 120,
    caffeine: 75,
    volume: '250 мл',
    rating: 4.8,
    reviews: 234,
    ingredients: ['Эспрессо', 'Молоко', 'Молочная пенка'],
    category: 'coffee',
  },
  'latte': {
    id: 'latte',
    name: 'Латте',
    price: 22000,
    image: '/images/cappuccino-card.png',
    description: 'Нежный кофе с молоком',
    fullDescription: 'Латте — мягкий и сливочный напиток для тех, кто предпочитает нежный вкус кофе. Больше молока, меньше кофейной горечи — идеальный выбор для любого времени дня.',
    calories: 150,
    caffeine: 63,
    volume: '300 мл',
    rating: 4.7,
    reviews: 189,
    ingredients: ['Эспрессо', 'Молоко', 'Тонкий слой пенки'],
    category: 'coffee',
  },
  'americano': {
    id: 'americano',
    name: 'Американо',
    price: 15000,
    image: '/images/americano-card.png',
    description: 'Эспрессо с горячей водой',
    fullDescription: 'Американо — классика для ценителей чистого кофейного вкуса. Двойной эспрессо, разбавленный горячей водой, раскрывает все оттенки вкуса кофейных зёрен.',
    calories: 15,
    caffeine: 150,
    volume: '250 мл',
    rating: 4.6,
    reviews: 156,
    ingredients: ['Двойной эспрессо', 'Горячая вода'],
    category: 'coffee',
  },
  'espresso': {
    id: 'espresso',
    name: 'Эспрессо',
    price: 12000,
    image: '/images/espresso-card.png',
    description: 'Классический итальянский эспрессо',
    fullDescription: 'Эспрессо — концентрированный кофейный напиток с насыщенным вкусом и плотной крема. Идеальный способ быстро взбодриться и насладиться настоящим кофе.',
    calories: 5,
    caffeine: 63,
    volume: '30 мл',
    rating: 4.9,
    reviews: 312,
    ingredients: ['Свежемолотый кофе', 'Вода под давлением'],
    category: 'coffee',
  },
};

export default function DrinkDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { haptic } = useTelegram();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { setPendingDrink } = usePendingOrderStore();

  const drink = drinksData[id || ''] || drinksData['cappuccino'];
  const favorite = isFavorite(drink.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const handleFavorite = () => {
    haptic.selection();
    if (favorite) {
      removeFavorite(drink.id);
      toast.success('Удалено из избранного');
    } else {
      addFavorite({
        id: drink.id,
        name: drink.name,
        price: drink.price,
        image: drink.image,
        description: drink.description,
        category: drink.category,
      });
      toast.success('Добавлено в избранное');
    }
  };

  const handleOrder = () => {
    haptic.impact('medium');
    // Save drink to pending order
    setPendingDrink({
      id: drink.id,
      name: drink.name,
      price: drink.price,
      image: drink.image,
      description: drink.description,
    });
    // Navigate to location selection
    navigate('/locations?order=true');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Image */}
      <div className="relative">
        <div className="aspect-square bg-secondary/50 relative overflow-hidden">
          <img 
            src={drink.image} 
            alt={drink.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        
        {/* Back button */}
        <Link href="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 left-4 rounded-full bg-white/80 backdrop-blur hover:bg-white"
            onClick={() => haptic.selection()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        
        {/* Favorite button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 rounded-full bg-white/80 backdrop-blur hover:bg-white"
          onClick={handleFavorite}
        >
          <Heart className={`w-5 h-5 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <main className="px-4 -mt-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Main info card */}
          <Card className="coffee-card mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">{drink.name}</h1>
                <p className="text-muted-foreground">{drink.description}</p>
              </div>
              <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-sm">{drink.rating}</span>
                <span className="text-xs text-muted-foreground">({drink.reviews})</span>
              </div>
            </div>
            
            <p className="text-foreground/80 leading-relaxed mb-4">
              {drink.fullDescription}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-secondary/50 rounded-xl">
                <Coffee className="w-5 h-5 mx-auto mb-1 text-espresso" />
                <p className="font-semibold text-sm">{drink.volume}</p>
                <p className="text-xs text-muted-foreground">Объём</p>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-xl">
                <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                <p className="font-semibold text-sm">{drink.calories}</p>
                <p className="text-xs text-muted-foreground">Калорий</p>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-xl">
                <Droplets className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <p className="font-semibold text-sm">{drink.caffeine} мг</p>
                <p className="text-xs text-muted-foreground">Кофеин</p>
              </div>
            </div>
          </Card>

          {/* Ingredients */}
          <Card className="coffee-card">
            <h3 className="font-display font-semibold text-foreground mb-3">Состав</h3>
            <div className="flex flex-wrap gap-2">
              {drink.ingredients.map((ingredient, index) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 bg-secondary rounded-full text-sm text-foreground"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>

      {/* Fixed bottom bar with price and order button */}
      <div className="fixed bottom-20 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-4 z-40">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">Цена</p>
            <p className="font-display text-2xl font-bold text-espresso">
              {formatPrice(drink.price)} <span className="text-base font-normal">UZS</span>
            </p>
          </div>
          <Button 
            size="lg"
            className="btn-espresso px-8 h-14 text-lg"
            onClick={handleOrder}
          >
            Заказать
          </Button>
        </div>
      </div>
    </div>
  );
}
