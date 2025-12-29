/**
 * VendHub TWA - Order Success Page
 * "Warm Brew" Design System
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { CheckCircle, Coffee, Home, Gift, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useConfetti } from "@/hooks/useConfetti";
import { trpc } from "@/lib/trpc";

export default function OrderSuccess() {
  const { haptic } = useTelegram();
  const { fireConfetti, fireEmoji } = useConfetti();
  const [showFirstOrderBonus, setShowFirstOrderBonus] = useState(false);
  
  // Get user stats to check if this was first order
  const { data: userStats } = trpc.profile.stats.useQuery();

  useEffect(() => {
    // Trigger success haptic on mount
    haptic.notification('success');
    
    // Fire confetti on successful order
    setTimeout(() => {
      fireConfetti('bonus');
    }, 500);
    
    // Check if this was first order (totalOrders === 1)
    if (userStats?.totalOrders === 1) {
      setShowFirstOrderBonus(true);
      // Fire special first order confetti
      setTimeout(() => {
        fireConfetti('firstOrder');
      }, 1500);
    }
  }, [userStats?.totalOrders]);

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 10 }}
            >
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Заказ оформлен!
          </h1>
          <p className="text-muted-foreground">
            Ваш напиток скоро будет готов
          </p>
        </motion.div>

        {/* Order Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm"
        >
          <Card className="coffee-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-espresso flex items-center justify-center">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Заказ #12345</p>
                <p className="text-sm text-muted-foreground">KIUT Корпус А · M-001</p>
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                Подойдите к автомату и заберите ваш напиток
              </p>
            </div>
          </Card>
        </motion.div>

        {/* First Order Bonus */}
        {showFirstOrderBonus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="w-full max-w-sm mt-4"
          >
            <Card className="coffee-card bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-300 dark:border-purple-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">🎉 Бонус за первый заказ!</p>
                  <p className="text-sm text-muted-foreground">Вам начислено 10,000 баллов</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Bonus Earned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm mt-4"
        >
          <Card className="coffee-card bg-gradient-to-r from-caramel/20 to-caramel/10 border-caramel/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-caramel" />
                <span className="text-sm text-foreground">Начислено бонусов</span>
              </div>
              <span className="font-semibold text-espresso dark:text-caramel">+495 UZS</span>
            </div>
          </Card>
        </motion.div>
      </main>

      {/* Bottom Actions */}
      <div className="px-4 pb-8 space-y-3">
        <Link href="/">
          <Button 
            className="w-full h-14 rounded-2xl btn-espresso text-base"
            onClick={() => haptic.impact('light')}
          >
            <Home className="w-5 h-5 mr-2" />
            На главную
          </Button>
        </Link>
        
        <Link href="/profile/history">
          <Button 
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={() => haptic.selection()}
          >
            Мои заказы
          </Button>
        </Link>
      </div>
    </div>
  );
}
