/**
 * VendHub TWA - Rewards Store Page
 * Users can claim rewards that award bonus points (1 point = 1 sum)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useTelegram } from "@/contexts/TelegramContext";
import { 
  ArrowLeft, 
  Gift, 
  Coffee, 
  Percent, 
  Sparkles,
  Star,
  CheckCircle2,
  Loader2,
  Ticket,
  Copy,
  Check
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Reward type icons
const rewardTypeIcons: Record<string, React.ReactNode> = {
  bonus_points: <Star className="h-5 w-5" />,
  promo_code: <Ticket className="h-5 w-5" />,
  free_drink: <Coffee className="h-5 w-5" />,
  discount_percent: <Percent className="h-5 w-5" />,
  discount_fixed: <Ticket className="h-5 w-5" />,
  custom: <Gift className="h-5 w-5" />,
};

// Reward type colors
const rewardTypeColors: Record<string, string> = {
  bonus_points: "bg-gradient-to-br from-amber-500 to-yellow-600",
  promo_code: "bg-gradient-to-br from-blue-500 to-indigo-600",
  free_drink: "bg-gradient-to-br from-amber-600 to-orange-600",
  discount_percent: "bg-gradient-to-br from-green-500 to-emerald-600",
  discount_fixed: "bg-gradient-to-br from-purple-500 to-violet-600",
  custom: "bg-gradient-to-br from-gray-500 to-slate-600",
};

// Format points with thousands separator
function formatPoints(points: number): string {
  return points.toLocaleString('ru-RU');
}

// Format date
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RewardsStore() {
  const { haptic } = useTelegram();
  
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [selectedUserReward, setSelectedUserReward] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Fetch user's points balance
  const { data: pointsData, refetch: refetchPoints } = trpc.gamification.points.useQuery();
  const pointsBalance = pointsData || 0;
  
  // Fetch available rewards
  const { data: rewards, isLoading: loadingRewards } = trpc.rewards.list.useQuery();
  
  // Fetch user's rewards
  const { data: myRewards, isLoading: loadingMyRewards, refetch: refetchMyRewards } = trpc.rewards.myRewards.useQuery();
  
  // Purchase mutation
  const purchaseMutation = trpc.rewards.purchase.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        haptic?.notification('success');
        const pointsAwarded = data.pointsAwarded || 0;
        if (pointsAwarded > 0) {
          toast.success(`+${formatPoints(pointsAwarded)} баллов!`, {
            description: 'Баллы зачислены на ваш счёт',
          });
        } else {
          toast.success('Награда получена!', {
            description: 'Награда добавлена в ваш профиль',
          });
        }
        setShowPurchaseDialog(false);
        refetchMyRewards();
        refetchPoints();
      } else {
        haptic?.notification('error');
        toast.error(data.error || 'Не удалось получить награду');
      }
    },
    onError: () => {
      haptic?.notification('error');
      toast.error('Не удалось получить награду');
    },
  });
  
  const handlePurchase = (reward: any) => {
    haptic?.impact('light');
    setSelectedReward(reward);
    setShowPurchaseDialog(true);
  };
  
  const confirmPurchase = () => {
    if (selectedReward) {
      purchaseMutation.mutate({ rewardId: selectedReward.id });
    }
  };
  
  const handleViewReward = (userReward: any) => {
    haptic?.impact('light');
    setSelectedUserReward(userReward);
    setShowRewardDialog(true);
  };
  
  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    haptic?.notification('success');
    toast.success('Промокод скопирован!');
    setTimeout(() => setCopiedCode(false), 2000);
  };
  
  // Featured rewards
  const featuredRewards = rewards?.filter(r => r.isFeatured) || [];
  const regularRewards = rewards?.filter(r => !r.isFeatured) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Магазин наград</h1>
              <p className="text-sm text-muted-foreground">
                1 балл = 1 сум
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 px-4 py-2 rounded-full">
              <Star className="h-5 w-5 text-amber-500" />
              <span className="font-bold text-amber-600">{formatPoints(pointsBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        <Tabs defaultValue="store" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="store" className="gap-2">
              <Gift className="h-4 w-4" />
              Магазин
            </TabsTrigger>
            <TabsTrigger value="my-rewards" className="gap-2">
              <Ticket className="h-4 w-4" />
              История
              {myRewards && myRewards.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {myRewards.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Store Tab */}
          <TabsContent value="store" className="mt-6 space-y-6">
            {loadingRewards ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : rewards?.length === 0 ? (
              <Card className="p-8 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Награды скоро появятся</h3>
                <p className="text-sm text-muted-foreground">
                  Следите за обновлениями
                </p>
              </Card>
            ) : (
              <>
                {/* Featured Rewards */}
                {featuredRewards.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      <h2 className="font-semibold">Популярные награды</h2>
                    </div>
                    <div className="grid gap-4">
                      {featuredRewards.map((reward) => (
                        <motion.div
                          key={reward.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card 
                            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => handlePurchase(reward)}
                          >
                            <div className="flex">
                              <div className={`w-24 h-24 flex items-center justify-center ${rewardTypeColors[reward.rewardType]} text-white`}>
                                <div className="text-3xl">
                                  {rewardTypeIcons[reward.rewardType]}
                                </div>
                              </div>
                              <div className="flex-1 p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-semibold">{reward.nameRu || reward.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {reward.descriptionRu || reward.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  {reward.pointsAwarded && reward.pointsAwarded > 0 && (
                                    <Badge className="bg-green-500 text-white">
                                      +{formatPoints(reward.pointsAwarded)} баллов
                                    </Badge>
                                  )}
                                  {reward.pointsCost > 0 && (
                                    <Badge variant="secondary">
                                      <Star className="h-3 w-3 mr-1" />
                                      {formatPoints(reward.pointsCost)}
                                    </Badge>
                                  )}
                                  {reward.stockLimit && (
                                    <Badge variant="outline" className="text-xs">
                                      Осталось: {reward.stockRemaining}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Rewards */}
                {regularRewards.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="font-semibold">Все награды</h2>
                    <div className="grid gap-3">
                      {regularRewards.map((reward) => (
                        <motion.div
                          key={reward.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card 
                            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handlePurchase(reward)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${rewardTypeColors[reward.rewardType]} text-white`}>
                                {rewardTypeIcons[reward.rewardType]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{reward.nameRu || reward.name}</h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {reward.descriptionRu || reward.description}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                {reward.pointsAwarded && reward.pointsAwarded > 0 && (
                                  <div className="text-green-600 font-semibold">
                                    +{formatPoints(reward.pointsAwarded)}
                                  </div>
                                )}
                                {reward.pointsCost > 0 && (
                                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                    <Star className="h-3 w-3" />
                                    {formatPoints(reward.pointsCost)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* My Rewards Tab */}
          <TabsContent value="my-rewards" className="mt-6">
            {loadingMyRewards ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !myRewards || myRewards.length === 0 ? (
              <Card className="p-8 text-center">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Нет полученных наград</h3>
                <p className="text-sm text-muted-foreground">
                  Получите награды в магазине
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {myRewards.map((userReward) => (
                  <motion.div
                    key={userReward.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card 
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewReward(userReward)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${rewardTypeColors[userReward.reward.rewardType]} text-white`}>
                          {rewardTypeIcons[userReward.reward.rewardType]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {userReward.reward.nameRu || userReward.reward.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(userReward.claimedAt)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {userReward.pointsAwarded > 0 && (
                            <Badge className="bg-green-500 text-white">
                              +{formatPoints(userReward.pointsAwarded)}
                            </Badge>
                          )}
                          {userReward.promoCode && (
                            <Badge variant="outline">
                              {userReward.promoCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Получить награду</DialogTitle>
            <DialogDescription>
              {selectedReward?.nameRu || selectedReward?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="space-y-4">
              <div className={`w-full h-32 rounded-lg flex items-center justify-center ${rewardTypeColors[selectedReward.rewardType]} text-white`}>
                <div className="text-5xl">
                  {rewardTypeIcons[selectedReward.rewardType]}
                </div>
              </div>
              
              <p className="text-muted-foreground">
                {selectedReward.descriptionRu || selectedReward.description}
              </p>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  {selectedReward.pointsCost > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Стоимость: <span className="font-semibold text-foreground">{formatPoints(selectedReward.pointsCost)} баллов</span>
                    </div>
                  )}
                  {selectedReward.pointsAwarded > 0 && (
                    <div className="text-sm text-green-600 font-semibold">
                      Вы получите: +{formatPoints(selectedReward.pointsAwarded)} баллов
                    </div>
                  )}
                  {selectedReward.promoCode && (
                    <div className="text-sm text-blue-600 font-semibold">
                      Промокод: {selectedReward.promoCode}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Ваш баланс</div>
                  <div className="font-semibold">{formatPoints(pointsBalance)} баллов</div>
                </div>
              </div>
              
              {selectedReward.pointsCost > pointsBalance && (
                <p className="text-sm text-destructive text-center">
                  Недостаточно баллов для получения награды
                </p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={confirmPurchase}
              disabled={purchaseMutation.isPending || (selectedReward?.pointsCost > pointsBalance)}
            >
              {purchaseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Получить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Детали награды</DialogTitle>
          </DialogHeader>
          
          {selectedUserReward && (
            <div className="space-y-4">
              <div className={`w-full h-32 rounded-lg flex items-center justify-center ${rewardTypeColors[selectedUserReward.reward.rewardType]} text-white`}>
                <div className="text-5xl">
                  {rewardTypeIcons[selectedUserReward.reward.rewardType]}
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {selectedUserReward.reward.nameRu || selectedUserReward.reward.name}
                </h3>
                <p className="text-muted-foreground">
                  {selectedUserReward.reward.descriptionRu || selectedUserReward.reward.description}
                </p>
              </div>
              
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Дата получения</span>
                  <span>{formatDate(selectedUserReward.claimedAt)}</span>
                </div>
                {selectedUserReward.pointsSpent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Потрачено баллов</span>
                    <span>{formatPoints(selectedUserReward.pointsSpent)}</span>
                  </div>
                )}
                {selectedUserReward.pointsAwarded > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Получено баллов</span>
                    <span className="text-green-600 font-semibold">+{formatPoints(selectedUserReward.pointsAwarded)}</span>
                  </div>
                )}
              </div>
              
              {selectedUserReward.promoCode && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Ваш промокод:</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xl font-mono font-bold text-center p-3 bg-white dark:bg-gray-900 rounded border">
                      {selectedUserReward.promoCode}
                    </code>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyPromoCode(selectedUserReward.promoCode)}
                    >
                      {copiedCode ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Введите этот код на экране автомата для получения скидки
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowRewardDialog(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
