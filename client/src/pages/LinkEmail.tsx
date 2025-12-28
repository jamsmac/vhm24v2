/**
 * VendHub TWA - Link Email Page
 * Simple one-click email linking with points reward
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTelegram } from "@/contexts/TelegramContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Mail, 
  Star, 
  Check, 
  Loader2,
  Sparkles,
  Gift
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";

export default function LinkEmail() {
  const { haptic } = useTelegram();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const linkEmailMutation = trpc.gamification.linkEmail.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setIsSuccess(true);
        haptic.notification('success');
        toast.success(`+${result.pointsAwarded} баллов!`, {
          description: 'Email успешно привязан',
        });
        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/profile/tasks');
        }, 2000);
      } else {
        toast.error(result.message);
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error('Ошибка при привязке email');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Введите корректный email');
      return;
    }
    
    haptic.impact('medium');
    setIsSubmitting(true);
    linkEmailMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/profile/tasks">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => haptic.selection()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold">Добавить Email</h1>
            <p className="text-xs text-muted-foreground">Получите баллы за привязку</p>
          </div>
        </div>
      </div>

      <main className="px-4 py-6">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Email привязан!
            </h2>
            <p className="text-muted-foreground mb-4">
              Баллы начислены на ваш счёт
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-600">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-lg">+50 баллов</span>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Reward Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 mb-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                      Награда за задание
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Привяжите email и получите баллы
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-200 dark:bg-amber-800">
                    <Star className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-amber-800 dark:text-amber-200">+50</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Email Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                
                <h2 className="font-display text-lg font-bold text-center text-foreground mb-2">
                  Введите ваш Email
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Мы будем отправлять вам уведомления о заказах и специальные предложения
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 text-base"
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    disabled={isSubmitting || !email}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Привязка...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Привязать и получить баллы
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Info */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-muted-foreground text-center mt-4"
            >
              Нажимая кнопку, вы соглашаетесь получать уведомления на указанный email
            </motion.p>
          </>
        )}
      </main>
    </div>
  );
}
