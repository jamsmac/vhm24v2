/**
 * VendHub TWA - Rewards Store Page
 * Users can exchange points for discounts, free drinks, and other rewards
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
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  Ticket,
  ArrowUpCircle,
  Crown
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

// Reward type icons
const rewardTypeIcons: Record<string, React.ReactNode> = {
  free_drink: <Coffee className="h-5 w-5" />,
  discount_percent: <Percent className="h-5 w-5" />,
  discount_fixed: <Ticket className="h-5 w-5" />,
  free_upgrade: <ArrowUpCircle className="h-5 w-5" />,
  bonus_points: <Star className="h-5 w-5" />,
  exclusive_item: <Crown className="h-5 w-5" />,
  custom: <Gift className="h-5 w-5" />,
};

// Reward type colors
const rewardTypeColors: Record<string, string> = {
  free_drink: "bg-amber-500",
  discount_percent: "bg-green-500",
  discount_fixed: "bg-blue-500",
  free_upgrade: "bg-purple-500",
  bonus_points: "bg-yellow-500",
  exclusive_item: "bg-pink-500",
  custom: "bg-gray-500",
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
  
  // Fetch user's points balance
  const { data: pointsData } = trpc.gamification.points.useQuery();
  const pointsBalance = pointsData || 0;
  
  // Fetch available rewards
  const { data: rewards, isLoading: loadingRewards } = trpc.rewards.list.useQuery();
  
  // Fetch user's rewards
  const { data: myRewards, isLoading: loadingMyRewards, refetch: refetchMyRewards } = trpc.rewards.myRewards.useQuery({});
  
  // Purchase mutation
  const purchaseMutation = trpc.rewards.purchase.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        haptic?.notification('success');
        toast.success('Награда получена!', {
          description: 'Награда добавлена в ваш профиль',
        });
        setShowPurchaseDialog(false);
        refetchMyRewards();
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
  
  // Redeem mutation
  const redeemMutation = trpc.rewards.redeem.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        haptic?.notification('success');
        toast.success('Награда использована!', {
          description: 'Награда успешно применена',
        });
        setShowRewardDialog(false);
        refetchMyRewards();
      } else {
        haptic?.notification('error');
        toast.error(data.error || 'Не удалось использовать награду');
      }
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
  
  const handleRedeem = () => {
    if (selectedUserReward) {
      redeemMutation.mutate({ userRewardId: selectedUserReward.id });
    }
  };
  
  // Separate rewards by status
  const activeRewards = myRewards?.filter(r => r.status === 'active') || [];
  const usedRewards = myRewards?.filter(r => r.status === 'redeemed' || r.status === 'expired') || [];
  
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
                Обменивайте баллы на награды
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-caramel/10 px-4 py-2 rounded-full">
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
              Мои награды
              {activeRewards.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeRewards.length}
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
                                  <Badge variant="secondary" className="shrink-0">
                                    <Star className="h-3 w-3 mr-1" />
                                    {formatPoints(reward.pointsCost)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {reward.validityDays} дней
                                  </Badge>
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
                    <div className="grid grid-cols-2 gap-4">
                      {regularRewards.map((reward) => (
                        <motion.div
                          key={reward.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <Card 
                            className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                              pointsBalance < reward.pointsCost ? 'opacity-60' : ''
                            }`}
                            onClick={() => handlePurchase(reward)}
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${rewardTypeColors[reward.rewardType]} text-white`}>
                              {rewardTypeIcons[reward.rewardType]}
                            </div>
                            <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                              {reward.nameRu || reward.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {reward.descriptionRu || reward.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                {formatPoints(reward.pointsCost)}
                              </Badge>
                              {pointsBalance < reward.pointsCost && (
                                <span className="text-xs text-red-500">
                                  -{formatPoints(reward.pointsCost - pointsBalance)}
                                </span>
                              )}
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
          <TabsContent value="my-rewards" className="mt-6 space-y-6">
            {loadingMyRewards ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myRewards?.length === 0 ? (
              <Card className="p-8 text-center">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">У вас пока нет наград</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Обменивайте баллы на награды в магазине
                </p>
                <Button variant="outline" onClick={() => {
                  const tabsList = document.querySelector('[role="tablist"]');
                  const storeTab = tabsList?.querySelector('[value="store"]') as HTMLButtonElement;
                  storeTab?.click();
                }}>
                  Перейти в магазин
                </Button>
              </Card>
            ) : (
              <>
                {/* Active Rewards */}
                {activeRewards.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <h2 className="font-semibold">Активные ({activeRewards.length})</h2>
                    </div>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {activeRewards.map((userReward) => (
                          <motion.div
                            key={userReward.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                          >
                            <Card 
                              className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-green-200 bg-green-50/50 dark:bg-green-950/20"
                              onClick={() => handleViewReward(userReward)}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${rewardTypeColors[userReward.reward.rewardType]} text-white`}>
                                  {rewardTypeIcons[userReward.reward.rewardType]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold truncate">
                                    {userReward.reward.nameRu || userReward.reward.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Код: <span className="font-mono font-bold">{userReward.redemptionCode}</span>
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      До {formatDate(userReward.expiresAt)}
                                    </span>
                                  </div>
                                </div>
                                <Button size="sm" className="shrink-0">
                                  Использовать
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
                
                {/* Used/Expired Rewards */}
                {usedRewards.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <h2 className="font-semibold text-muted-foreground">История ({usedRewards.length})</h2>
                    </div>
                    <div className="space-y-3">
                      {usedRewards.map((userReward) => (
                        <Card 
                          key={userReward.id}
                          className="p-4 opacity-60"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-muted text-muted-foreground`}>
                              {rewardTypeIcons[userReward.reward.rewardType]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">
                                {userReward.reward.nameRu || userReward.reward.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {userReward.status === 'redeemed' ? (
                                  <>Использовано {formatDate(userReward.redeemedAt!)}</>
                                ) : (
                                  <>Истекло {formatDate(userReward.expiresAt)}</>
                                )}
                              </p>
                            </div>
                            <Badge variant={userReward.status === 'redeemed' ? 'secondary' : 'destructive'}>
                              {userReward.status === 'redeemed' ? 'Использовано' : 'Истекло'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
              Подтвердите обмен баллов на награду
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${rewardTypeColors[selectedReward.rewardType]} text-white`}>
                    {rewardTypeIcons[selectedReward.rewardType]}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedReward.nameRu || selectedReward.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedReward.descriptionRu || selectedReward.description}
                    </p>
                  </div>
                </div>
              </Card>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Стоимость</p>
                  <p className="font-bold text-lg flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    {formatPoints(selectedReward.pointsCost)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Ваш баланс</p>
                  <p className={`font-bold text-lg ${pointsBalance < selectedReward.pointsCost ? 'text-red-500' : 'text-green-500'}`}>
                    {formatPoints(pointsBalance)}
                  </p>
                </div>
              </div>
              
              {pointsBalance < selectedReward.pointsCost && (
                <p className="text-sm text-red-500 text-center">
                  Недостаточно баллов. Нужно ещё {formatPoints(selectedReward.pointsCost - pointsBalance)}
                </p>
              )}
              
              <div className="text-xs text-muted-foreground text-center">
                Награда действительна {selectedReward.validityDays} дней после получения
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={confirmPurchase}
              disabled={!selectedReward || pointsBalance < selectedReward.pointsCost || purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Gift className="h-4 w-4 mr-2" />
              )}
              Получить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reward Detail Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ваша награда</DialogTitle>
            <DialogDescription>
              Покажите код кассиру или используйте при оформлении заказа
            </DialogDescription>
          </DialogHeader>
          
          {selectedUserReward && (
            <div className="space-y-4">
              <Card className="p-6 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${rewardTypeColors[selectedUserReward.reward.rewardType]} text-white`}>
                  <div className="text-3xl">
                    {rewardTypeIcons[selectedUserReward.reward.rewardType]}
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {selectedUserReward.reward.nameRu || selectedUserReward.reward.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedUserReward.reward.descriptionRu || selectedUserReward.reward.description}
                </p>
                
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Код награды</p>
                  <p className="font-mono text-2xl font-bold tracking-wider">
                    {selectedUserReward.redemptionCode}
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Действует до {formatDate(selectedUserReward.expiresAt)}</span>
                </div>
              </Card>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRewardDialog(false)} className="w-full sm:w-auto">
              Закрыть
            </Button>
            <Button 
              onClick={handleRedeem}
              disabled={redeemMutation.isPending}
              className="w-full sm:w-auto"
            >
              {redeemMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Отметить использованным
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
