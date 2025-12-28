/**
 * VendHub TWA - Referral Page
 * Allows users to share their referral link and track referral statistics
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Users, 
  Gift,
  TrendingUp,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export default function Referral() {
  const { haptic, webApp } = useTelegram();
  const [copied, setCopied] = useState(false);
  
  // Fetch referral stats
  const { data: stats, isLoading: statsLoading } = trpc.referral.getStats.useQuery();
  
  // Fetch referral list
  const { data: referrals, isLoading: referralsLoading } = trpc.referral.list.useQuery();
  
  const isLoading = statsLoading || referralsLoading;
  
  // Generate referral link
  const referralLink = stats?.code 
    ? `https://t.me/VendHubBot?start=ref_${stats.code}`
    : '';
  
  const handleCopyLink = async () => {
    if (!referralLink) return;
    
    haptic.impact('medium');
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Ссылка скопирована!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Не удалось скопировать');
    }
  };
  
  const handleShare = () => {
    if (!referralLink || !webApp) return;
    
    haptic.impact('medium');
    
    // Use Telegram's share functionality
    const shareText = `🎁 Присоединяйся к VendHub и получи 100 бонусных баллов!\n\nЗаказывай кофе из вендинговых автоматов быстро и удобно.\n\n${referralLink}`;
    
    // Try to use Telegram's native share
    if (webApp.openTelegramLink) {
      const encodedText = encodeURIComponent(shareText);
      webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodedText}`);
    } else {
      // Fallback to Web Share API
      if (navigator.share) {
        navigator.share({
          title: 'VendHub - Приглашение',
          text: shareText,
          url: referralLink,
        }).catch(() => {
          // User cancelled or error
        });
      } else {
        handleCopyLink();
      }
    }
  };
  
  const handleCopyCode = async () => {
    if (!stats?.code) return;
    
    haptic.selection();
    
    try {
      await navigator.clipboard.writeText(stats.code);
      toast.success('Код скопирован!');
    } catch (error) {
      toast.error('Не удалось скопировать');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => haptic.selection()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold">Пригласить друзей</h1>
            <p className="text-xs text-muted-foreground">Получайте баллы за приглашения</p>
          </div>
        </div>
      </div>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <Card className="p-6 mb-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-6 h-6" />
                  <span className="font-semibold">Приглашай и получай</span>
                </div>
                
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">200</span>
                  <span className="text-lg opacity-90">баллов</span>
                </div>
                
                <p className="text-sm opacity-90 mb-4">
                  За каждого друга, который зарегистрируется по вашей ссылке
                </p>
                
                <div className="flex items-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Друг тоже получит <strong>100 баллов</strong></span>
                </div>
              </div>
            </Card>

            {/* Referral Code & Link */}
            <Card className="p-4 mb-4">
              <h3 className="font-semibold mb-3">Ваш код приглашения</h3>
              
              {/* Code Display */}
              <div 
                className="bg-muted rounded-lg px-4 py-3 mb-3 flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={handleCopyCode}
              >
                <span className="font-mono text-xl font-bold tracking-wider">
                  {stats?.code || '--------'}
                </span>
                <Copy className="w-5 h-5 text-muted-foreground" />
              </div>
              
              {/* Share Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Поделиться
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Копировать
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Statistics */}
            <Card className="p-4 mb-4">
              <h3 className="font-semibold mb-3">Статистика</h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
                  <div className="text-xs text-muted-foreground">Приглашено</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <div className="text-2xl font-bold">{stats?.totalPointsEarned || 0}</div>
                  <div className="text-xs text-muted-foreground">Заработано</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                  <div className="text-2xl font-bold">{stats?.pendingReferrals || 0}</div>
                  <div className="text-xs text-muted-foreground">Ожидают</div>
                </div>
              </div>
            </Card>

            {/* Referral List */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Приглашённые друзья</h3>
              
              {referrals && referrals.length > 0 ? (
                <div className="space-y-3">
                  <AnimatePresence>
                    {referrals.map((referral, index) => (
                      <motion.div
                        key={referral.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg",
                          referral.status === 'completed' 
                            ? "bg-green-50 dark:bg-green-900/20" 
                            : "bg-muted"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          referral.status === 'completed'
                            ? "bg-green-100 dark:bg-green-800"
                            : "bg-amber-100 dark:bg-amber-800"
                        )}>
                          {referral.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {referral.referredUserName || 'Пользователь'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {referral.status === 'completed' 
                              ? `+${referral.pointsAwarded} баллов`
                              : 'Ожидает завершения'
                            }
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {new Date(referral.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-2">
                    Пока нет приглашённых друзей
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Поделитесь ссылкой и получайте баллы!
                  </p>
                </div>
              )}
            </Card>

            {/* How it works */}
            <Card className="p-4 mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">Как это работает?</h3>
              
              <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Поделитесь ссылкой с другом</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Друг регистрируется по вашей ссылке</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Вы получаете 200 баллов, друг — 100 баллов</span>
                </li>
              </ol>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
