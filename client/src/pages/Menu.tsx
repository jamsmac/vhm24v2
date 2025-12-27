/**
 * VendHub TWA - Menu Page
 * "Warm Brew" Design System
 * 
 * Features:
 * - Category tabs
 * - Product cards with images
 * - Add to cart functionality
 * - Floating cart button
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { useCartStore, MenuItem } from "@/stores/cartStore";
import { ArrowLeft, Plus, Minus, ShoppingCart, Coffee } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

// Mock menu data
const mockMenu: MenuItem[] = [
  {
    id: "1",
    name: "Эспрессо",
    nameUz: "Espresso",
    description: "Классический итальянский эспрессо",
    price: 12000,
    image: "/images/espresso-card.png",
    category: "coffee",
    isAvailable: true,
  },
  {
    id: "2",
    name: "Американо",
    nameUz: "Amerikano",
    description: "Эспрессо с горячей водой",
    price: 15000,
    image: "/images/americano-card.png",
    category: "coffee",
    isAvailable: true,
  },
  {
    id: "3",
    name: "Капучино",
    nameUz: "Kapuchino",
    description: "Эспрессо с молочной пенкой",
    price: 20000,
    image: "/images/cappuccino-card.png",
    category: "coffee",
    isAvailable: true,
  },
  {
    id: "4",
    name: "Латте",
    nameUz: "Latte",
    description: "Нежный кофе с молоком",
    price: 22000,
    image: "/images/cappuccino-card.png",
    category: "coffee",
    isAvailable: true,
  },
  {
    id: "5",
    name: "Мокко",
    nameUz: "Mokko",
    description: "Кофе с шоколадом и молоком",
    price: 25000,
    image: "/images/cappuccino-card.png",
    category: "coffee",
    isAvailable: false,
  },
  {
    id: "6",
    name: "Чай зелёный",
    nameUz: "Yashil choy",
    description: "Классический зелёный чай",
    price: 10000,
    image: "/images/americano-card.png",
    category: "tea",
    isAvailable: true,
  },
  {
    id: "7",
    name: "Чай чёрный",
    nameUz: "Qora choy",
    description: "Крепкий чёрный чай",
    price: 10000,
    image: "/images/americano-card.png",
    category: "tea",
    isAvailable: true,
  },
  {
    id: "8",
    name: "Горячий шоколад",
    nameUz: "Issiq shokolad",
    description: "Насыщенный шоколадный напиток",
    price: 18000,
    image: "/images/cappuccino-card.png",
    category: "other",
    isAvailable: true,
  },
];

const categories = [
  { id: "all", name: "Все", nameUz: "Hammasi" },
  { id: "coffee", name: "Кофе", nameUz: "Qahva" },
  { id: "tea", name: "Чай", nameUz: "Choy" },
  { id: "other", name: "Другое", nameUz: "Boshqa" },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price);
}

export default function Menu() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { haptic } = useTelegram();
  const { machine, items, addItem, updateQuantity, getTotalItems, getTotal } = useCartStore();
  const [activeCategory, setActiveCategory] = useState("all");

  // Redirect if no machine selected
  useEffect(() => {
    if (!machine) {
      navigate('/locations');
    }
  }, [machine, navigate]);

  const filteredMenu = activeCategory === "all" 
    ? mockMenu 
    : mockMenu.filter(item => item.category === activeCategory);

  const getItemQuantity = (itemId: string): number => {
    const item = items.find(i => i.id === itemId);
    return item?.quantity || 0;
  };

  const handleAddItem = (item: MenuItem) => {
    if (!item.isAvailable) {
      haptic.notification('error');
      return;
    }
    haptic.impact('light');
    addItem(item);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    haptic.selection();
    const currentQty = getItemQuantity(itemId);
    updateQuantity(itemId, currentQty + delta);
  };

  const totalItems = getTotalItems();
  const totalPrice = getTotal();

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/locations">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold truncate">{machine?.name || 'Меню'}</h1>
            <p className="text-xs text-muted-foreground truncate">{machine?.machineNumber} · {machine?.locationName}</p>
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                haptic.selection();
                setActiveCategory(cat.id);
              }}
              className={`category-pill whitespace-nowrap ${activeCategory === cat.id ? 'active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Menu Grid */}
      <main className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredMenu.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className={`coffee-card overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}>
                {/* Image */}
                <div className="relative aspect-square -mx-4 -mt-4 mb-3">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Нет в наличии</span>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div>
                  <h3 className="font-semibold text-foreground text-sm truncate">{item.name}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="price-tag text-sm">{formatPrice(item.price)} UZS</span>
                    
                    {/* Add/Quantity Controls */}
                    {item.isAvailable && (
                      <AnimatePresence mode="wait">
                        {getItemQuantity(item.id) === 0 ? (
                          <motion.div
                            key="add"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                          >
                            <Button
                              size="icon"
                              className="w-8 h-8 rounded-full bg-[#5D4037] hover:bg-[#4E342E]"
                              onClick={() => handleAddItem(item)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="quantity"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex items-center gap-1"
                          >
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-7 h-7 rounded-full"
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-semibold">
                              {getItemQuantity(item.id)}
                            </span>
                            <Button
                              size="icon"
                              className="w-7 h-7 rounded-full bg-[#5D4037] hover:bg-[#4E342E]"
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-4 right-4 z-50"
          >
            <Link href="/cart">
              <Button 
                className="w-full h-14 rounded-2xl btn-espresso text-base"
                onClick={() => haptic.impact('medium')}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <ShoppingCart className="w-5 h-5" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#D4A574] rounded-full text-xs flex items-center justify-center font-bold">
                        {totalItems}
                      </span>
                    </div>
                    <span>Корзина</span>
                  </div>
                  <span className="font-bold">{formatPrice(totalPrice)} UZS</span>
                </div>
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
