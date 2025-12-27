/**
 * VendHub TWA - Help Page
 * "Warm Brew" Design System
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { ArrowLeft, MessageCircle, Phone, Mail, ChevronDown, Coffee, QrCode, CreditCard, Gift } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const faqs = [
  {
    icon: QrCode,
    question: "Как сделать заказ?",
    answer: "Отсканируйте QR-код на автомате или выберите автомат из списка. Добавьте напитки в корзину и оплатите удобным способом."
  },
  {
    icon: CreditCard,
    question: "Какие способы оплаты доступны?",
    answer: "Мы принимаем оплату через Click, Payme и Uzum. Выберите удобный способ при оформлении заказа."
  },
  {
    icon: Gift,
    question: "Как работают бонусы?",
    answer: "За каждую покупку вы получаете бонусы (1% от суммы). Накопленные бонусы можно использовать для оплаты следующих заказов."
  },
  {
    icon: Coffee,
    question: "Что делать, если автомат не работает?",
    answer: "Если автомат не выдал напиток после оплаты, свяжитесь с нашей поддержкой. Мы вернём деньги или начислим бонусы."
  },
];

export default function Help() {
  const { haptic, webApp } = useTelegram();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleContact = (type: 'telegram' | 'phone' | 'email') => {
    haptic.impact('light');
    
    switch (type) {
      case 'telegram':
        webApp?.openTelegramLink('https://t.me/vendhub_support');
        break;
      case 'phone':
        window.open('tel:+998901234567', '_blank');
        break;
      case 'email':
        window.open('mailto:support@vendhub.uz', '_blank');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-display text-xl font-bold">Помощь</h1>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="font-semibold text-foreground mb-3">Связаться с нами</h2>
          <div className="grid grid-cols-3 gap-3">
            <Card 
              className="coffee-card cursor-pointer hover:shadow-md transition-shadow text-center p-4"
              onClick={() => handleContact('telegram')}
            >
              <div className="w-12 h-12 rounded-full bg-[#0088cc]/10 flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-6 h-6 text-[#0088cc]" />
              </div>
              <span className="text-sm font-medium">Telegram</span>
            </Card>
            
            <Card 
              className="coffee-card cursor-pointer hover:shadow-md transition-shadow text-center p-4"
              onClick={() => handleContact('phone')}
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium">Позвонить</span>
            </Card>
            
            <Card 
              className="coffee-card cursor-pointer hover:shadow-md transition-shadow text-center p-4"
              onClick={() => handleContact('email')}
            >
              <div className="w-12 h-12 rounded-full bg-[#5D4037]/10 flex items-center justify-center mx-auto mb-2">
                <Mail className="w-6 h-6 text-[#5D4037]" />
              </div>
              <span className="text-sm font-medium">Email</span>
            </Card>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 className="font-semibold text-foreground mb-3">Частые вопросы</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const Icon = faq.icon;
              const isOpen = openFaq === index;
              
              return (
                <Card 
                  key={index}
                  className="coffee-card cursor-pointer"
                  onClick={() => {
                    haptic.selection();
                    setOpenFaq(isOpen ? null : index);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#5D4037]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground pr-2">{faq.question}</p>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Support Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="coffee-card bg-secondary/50">
            <div className="text-center">
              <p className="font-medium text-foreground mb-1">Время работы поддержки</p>
              <p className="text-sm text-muted-foreground">Пн-Пт: 9:00 - 18:00</p>
              <p className="text-sm text-muted-foreground">Сб-Вс: 10:00 - 16:00</p>
            </div>
          </Card>
        </motion.div>
      </main>

      <div className="h-8" />
    </div>
  );
}
