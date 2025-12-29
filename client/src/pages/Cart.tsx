/**
 * VendHub TWA - Cart Page
 * "Warm Brew" Design System
 * 
 * Features:
 * - Cart items with quantity controls
 * - Promo code input
 * - Payment method selection (Click, Payme, Uzum)
 * - Order summary
 * - Telegram MainButton for checkout
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTelegram } from "@/contexts/TelegramContext";
import { useCartStore } from "@/stores/cartStore";
import { ArrowLeft, Plus, Minus, Trash2, Tag, MapPin, CreditCard, Check, X, Send } from "lucide-react";
import CartRecommendations from "@/components/CartRecommendations";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { useTelegramInvoice } from "@/hooks/useTelegramInvoice";
import { useUserStore, getLevelDiscount, getLevelDiscountAmount, getLoyaltyLevelName } from "@/stores/userStore";

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price);
}

type PaymentProvider = 'click' | 'payme' | 'uzum' | 'telegram';

const paymentMethods: Array<{ id: PaymentProvider; name: string; logo: string; color: string; icon?: React.ReactNode }> = [
  { id: 'telegram', name: 'Telegram', logo: '✈️', color: '#0088cc' },
  { id: 'click', name: 'Click', logo: '💳', color: '#00A1E4' },
  { id: 'payme', name: 'Payme', logo: '💳', color: '#00CCCC' },
  { id: 'uzum', name: 'Uzum', logo: '💳', color: '#7B2D8E' },
];

export default function Cart() {
  const [, navigate] = useLocation();
  const { haptic, isTelegram, popup, invoice } = useTelegram();
  const telegramInvoice = useTelegramInvoice();
  const { 
    machine, 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart,
    promoCode,
    promoDiscount,
    applyPromo,
    removePromo,
    getSubtotal, 
    getDiscount, 
    getTotal 
  } = useCartStore();
  
  const [promoInput, setPromoInput] = useState("");
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  // Default to Telegram payment if available, otherwise Click
  const [selectedPayment, setSelectedPayment] = useState<PaymentProvider>(isTelegram ? 'telegram' : 'click');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

  // Telegram BackButton - navigate back to menu or locations
  useTelegramBackButton({
    isVisible: true,
    onClick: () => {
      if (machine) {
        navigate(`/menu/${machine.id}`);
      } else {
        navigate('/locations');
      }
    }
  });

  // Handle checkout action with confirmation popup
  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    // Show confirmation popup before payment
    const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsText = itemsCount === 1 ? 'напиток' : itemsCount < 5 ? 'напитка' : 'напитков';
    
    // Use Telegram popup for confirmation
    const confirmed = await popup.showPopup({
      title: 'Подтверждение заказа',
      message: `Вы заказываете ${itemsCount} ${itemsText} на сумму ${formatPrice(total)} UZS.\n\nСпособ оплаты: ${paymentMethods.find(p => p.id === selectedPayment)?.name}\n\nПодтвердить оплату?`,
      buttons: [
        { id: 'cancel', type: 'cancel', text: 'Отмена' },
        { id: 'confirm', type: 'default', text: 'Оплатить' }
      ]
    });
    
    if (confirmed !== 'confirm') {
      haptic.selection();
      return;
    }
    
    setIsProcessing(true);
    haptic.impact('medium');
    
    // Show progress on MainButton if in Telegram
    if (mainButton.isAvailable) {
      mainButton.showProgress(true);
    }
    
    try {
      // Handle Telegram Invoice payment
      if (selectedPayment === 'telegram' && telegramInvoice.isAvailable) {
        // Create invoice data
        const invoiceData = {
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          total,
          currency: 'UZS',
          description: `Заказ в VendHub Coffee: ${itemsCount} ${itemsText}`,
          machineId: machine?.id,
          machineName: machine?.name,
          promoCode: promoCode || undefined,
          discount: discount > 0 ? discount : undefined,
        };
        
        // Open Telegram Invoice
        const status = await telegramInvoice.createAndOpenInvoice(invoiceData);
        
        if (status === 'paid') {
          haptic.notification('success');
          toast.success('Оплата успешна! Заказ оформлен.');
          clearCart();
          navigate('/order/success');
        } else if (status === 'cancelled') {
          haptic.selection();
          toast.info('Оплата отменена');
        } else if (status === 'pending') {
          // For demo mode or when invoice URL is opened in browser
          toast.info('Ожидается подтверждение оплаты...');
          // In production, you would poll for payment status or use webhooks
        } else {
          haptic.notification('error');
          toast.error('Ошибка оплаты. Попробуйте другой способ.');
        }
      } else {
        // Handle other payment methods (Click, Payme, Uzum)
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In real app, this would redirect to payment provider
        haptic.notification('success');
        toast.success('Заказ оформлен!');
        clearCart();
        navigate('/order/success');
      }
    } catch (error) {
      console.error('Payment error:', error);
      haptic.notification('error');
      toast.error('Ошибка обработки платежа');
    } finally {
      if (mainButton.isAvailable) {
        mainButton.hideProgress();
      }
      setIsProcessing(false);
    }
  };

  // Telegram MainButton for checkout
  const mainButton = useTelegramMainButton({
    text: `Оплатить ${formatPrice(total)} UZS`,
    isVisible: items.length > 0,
    isActive: !isProcessing && items.length > 0,
    onClick: handleCheckout
  });

  // Update MainButton text when total changes
  useEffect(() => {
    if (mainButton.isAvailable && items.length > 0) {
      mainButton.setText(`Оплатить ${formatPrice(total)} UZS`);
    }
  }, [total, items.length, mainButton]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    
    setIsPromoLoading(true);
    haptic.selection();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock promo validation
    if (promoInput.toUpperCase() === 'COFFEE10') {
      applyPromo(promoInput.toUpperCase(), 10);
      haptic.notification('success');
      toast.success('Промокод применён! Скидка 10%');
    } else if (promoInput.toUpperCase() === 'WELCOME') {
      applyPromo(promoInput.toUpperCase(), 15);
      haptic.notification('success');
      toast.success('Промокод применён! Скидка 15%');
    } else {
      haptic.notification('error');
      toast.error('Промокод недействителен');
    }
    
    setIsPromoLoading(false);
    setPromoInput("");
  };

  const handleRemovePromo = () => {
    haptic.selection();
    removePromo();
    toast.info('Промокод удалён');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background safe-top safe-bottom flex flex-col">
        <header className="px-4 py-3 border-b border-border flex items-center gap-3">
          <Link href={machine ? `/menu/${machine.id}` : '/locations'}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold">Корзина</h1>
        </header>
        
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Tag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Корзина пуста</h2>
          <p className="text-muted-foreground text-center mb-6">Добавьте напитки из меню</p>
          <Link href="/locations">
            <Button className="btn-espresso">
              Выбрать автомат
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background safe-top safe-bottom ${isTelegram ? 'pb-4' : 'pb-32'}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href={machine ? `/menu/${machine.id}` : '/locations'}>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-display text-xl font-bold">Корзина</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Machine Info */}
        {machine && (
          <Card className="coffee-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#5D4037] dark:text-[#D4A574]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{machine.name}</p>
                <p className="text-sm text-muted-foreground">{machine.machineNumber} · {machine.address}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Cart Items */}
        <Card className="coffee-card">
          <h2 className="font-semibold text-foreground mb-4">Ваш заказ</h2>
          <div className="space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3"
                >
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.price)} UZS</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="w-8 h-8 rounded-full"
                      onClick={() => {
                        haptic.selection();
                        updateQuantity(item.id, item.quantity - 1);
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                    <Button
                      size="icon"
                      className="w-8 h-8 rounded-full bg-[#5D4037] hover:bg-[#4E342E]"
                      onClick={() => {
                        haptic.selection();
                        updateQuantity(item.id, item.quantity + 1);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 rounded-full text-destructive hover:text-destructive"
                    onClick={() => {
                      haptic.impact('light');
                      removeItem(item.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>

        {/* Promo Code */}
        <Card className="coffee-card">
          <h2 className="font-semibold text-foreground mb-3">Промокод</h2>
          {promoCode ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-700 dark:text-green-300">{promoCode}</span>
                <span className="text-sm text-green-600 dark:text-green-400">(-{promoDiscount}%)</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 rounded-full"
                onClick={handleRemovePromo}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Введите код"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                className="flex-1 h-11 rounded-xl"
              />
              <Button
                onClick={handleApplyPromo}
                disabled={isPromoLoading || !promoInput.trim()}
                className="h-11 px-6 rounded-xl bg-[#D4A574] hover:bg-[#C49664] text-white"
              >
                {isPromoLoading ? '...' : 'OK'}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">Попробуйте: COFFEE10 или WELCOME</p>
        </Card>

        {/* Payment Method */}
        <Card className="coffee-card">
          <h2 className="font-semibold text-foreground mb-3">Способ оплаты</h2>
          
          {/* Telegram Payment - Recommended when in Telegram */}
          {isTelegram && (
            <button
              onClick={() => {
                haptic.selection();
                setSelectedPayment('telegram');
              }}
              className={`w-full p-4 rounded-xl border-2 transition-all mb-3 ${
                selectedPayment === 'telegram'
                  ? 'border-sky-500 bg-gradient-to-r from-sky-500/10 to-blue-500/10'
                  : 'border-border hover:border-sky-400/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Telegram Payments</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400">
                      Рекомендуем
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Быстрая оплата через Telegram</p>
                </div>
                {selectedPayment === 'telegram' && (
                  <Check className="w-5 h-5 text-sky-500" />
                )}
              </div>
            </button>
          )}
          
          {/* Other payment methods */}
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.filter(m => m.id !== 'telegram').map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  haptic.selection();
                  setSelectedPayment(method.id);
                }}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedPayment === method.id
                    ? 'border-[#5D4037] dark:border-[#D4A574] bg-[#5D4037]/5 dark:bg-[#D4A574]/10'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="text-2xl mb-1">{method.logo}</div>
                <span className="text-sm font-medium">{method.name}</span>
              </button>
            ))}
          </div>
          
          {/* Info about Telegram Payments */}
          {selectedPayment === 'telegram' && isTelegram && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Оплата будет обработана через защищённую систему Telegram
            </p>
          )}
        </Card>

        {/* You Might Also Like */}
        <CartRecommendations limit={3} />

        {/* Order Summary */}
        <Card className="coffee-card">
          <h2 className="font-semibold text-foreground mb-3">Итого</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Подитог</span>
              <span>{formatPrice(subtotal)} UZS</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Скидка ({promoDiscount}%)</span>
                <span>-{formatPrice(discount)} UZS</span>
              </div>
            )}
            <div className="pt-2 border-t border-border flex justify-between font-semibold text-base">
              <span>К оплате</span>
              <span className="text-[#5D4037] dark:text-[#D4A574]">{formatPrice(total)} UZS</span>
            </div>
          </div>
        </Card>

        {/* Telegram MainButton info */}
        {isTelegram && (
          <p className="text-xs text-center text-muted-foreground">
            Нажмите кнопку внизу для оплаты
          </p>
        )}
      </main>

      {/* Fallback Checkout Button - only show when not in Telegram */}
      {!isTelegram && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
          <Button
            className="w-full h-14 rounded-2xl btn-espresso text-base"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Обработка...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Оплатить {formatPrice(total)} UZS
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
