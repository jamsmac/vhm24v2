/**
 * VendHub TWA - Order Success Page
 * "Warm Brew" Design System
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { CheckCircle, Coffee, Home, Gift } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function OrderSuccess() {
  const { haptic } = useTelegram();

  useEffect(() => {
    // Trigger success haptic on mount
    haptic.notification('success');
  }, []);

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
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 10 }}
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
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
              <div className="w-12 h-12 rounded-full bg-[#5D4037] flex items-center justify-center">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Заказ #12345</p>
                <p className="text-sm text-muted-foreground">KIUT Корпус А · M-001</p>
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800 text-center">
                Подойдите к автомату и заберите ваш напиток
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Bonus Earned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm mt-4"
        >
          <Card className="coffee-card bg-gradient-to-r from-[#D4A574]/20 to-[#B8956C]/20 border-[#D4A574]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-[#D4A574]" />
                <span className="text-sm text-foreground">Начислено бонусов</span>
              </div>
              <span className="font-semibold text-[#5D4037]">+495 UZS</span>
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
