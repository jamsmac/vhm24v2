/**
 * VendHub TWA - Modern Bottom Navigation
 * Floating tab bar with glassmorphism effect
 */

import { Home, QrCode, Heart, User, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useCartStore } from '@/stores/cartStore';
import { useTelegram } from '@/contexts/TelegramContext';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/profile/favorites', icon: Heart, label: 'Избранное' },
  { path: '/scan', icon: QrCode, label: 'Скан', isCenter: true },
  { path: '/cart', icon: ShoppingBag, label: 'Корзина' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

export default function BottomNav() {
  const [location] = useLocation();
  const { haptic } = useTelegram();
  const { items } = useCartStore();
  
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Hide on certain pages
  const hiddenPaths = ['/order/success'];
  if (hiddenPaths.some(p => location.startsWith(p))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe">
      <div className="relative mx-auto max-w-md">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20" />
        
        <div className="relative flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== '/' && location.startsWith(item.path));
            const Icon = item.icon;

            if (item.isCenter) {
              // Center QR Scanner button - elevated and prominent
              return (
                <Link key={item.path} href={item.path}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => haptic.impact('medium')}
                    className="relative -mt-6"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-espresso to-espresso/80 shadow-lg shadow-espresso/30 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      {item.label}
                    </span>
                  </motion.button>
                </Link>
              );
            }

            return (
              <Link key={item.path} href={item.path}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => haptic.selection()}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-2"
                >
                  <div className="relative">
                    <Icon 
                      className={`w-6 h-6 transition-colors ${
                        isActive 
                          ? 'text-espresso' 
                          : 'text-muted-foreground'
                      }`}
                    />
                    {/* Cart badge */}
                    {item.path === '/cart' && cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </motion.span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${
                    isActive 
                      ? 'text-espresso' 
                      : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </span>
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 w-1 h-1 bg-espresso rounded-full"
                    />
                  )}
                </motion.button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
