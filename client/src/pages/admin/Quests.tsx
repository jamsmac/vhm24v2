import { useState } from "react";
import { ArrowLeft, Plus, Target, Gift, Trash2, Edit2, Play, Pause, Loader2, Bell } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Quest {
  id: number;
  questKey: string;
  title: string;
  description: string;
  type: 'order' | 'spend' | 'visit' | 'referral' | 'share' | 'review';
  targetValue: number;
  rewardPoints: number;
  isActive: boolean;
  isWeekly?: boolean;
}

export default function AdminQuests() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [formData, setFormData] = useState({
    questKey: '',
    title: '',
    description: '',
    type: 'order' as Quest['type'],
    targetValue: 1,
    rewardPoints: 500,
  });

  const utils = trpc.useUtils();
  const { data: quests, isLoading } = trpc.admin.quests.list.useQuery();
  
  const seedMutation = trpc.admin.quests.seed.useMutation({
    onSuccess: () => {
      toast.success('Задания успешно созданы');
      utils.admin.quests.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const createMutation = trpc.admin.quests.create.useMutation({
    onSuccess: () => {
      toast.success('Задание создано');
      utils.admin.quests.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const updateMutation = trpc.admin.quests.update.useMutation({
    onSuccess: () => {
      toast.success('Задание обновлено');
      utils.admin.quests.list.invalidate();
      setEditingQuest(null);
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.quests.delete.useMutation({
    onSuccess: () => {
      toast.success('Задание удалено');
      utils.admin.quests.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const notifyMutation = trpc.admin.quests.notifyUsers.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Уведомления отправлены');
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      questKey: '',
      title: '',
      description: '',
      type: 'order',
      targetValue: 1,
      rewardPoints: 500,
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingQuest) return;
    updateMutation.mutate({
      id: editingQuest.id,
      title: formData.title,
      description: formData.description,
      targetValue: formData.targetValue,
      rewardPoints: formData.rewardPoints,
    });
  };

  const handleToggleActive = (quest: Quest) => {
    updateMutation.mutate({
      id: quest.id,
      isActive: !quest.isActive,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Удалить это задание?')) {
      deleteMutation.mutate({ id });
    }
  };

  const openEditDialog = (quest: Quest) => {
    setEditingQuest(quest);
    setFormData({
      questKey: quest.questKey,
      title: quest.title,
      description: quest.description,
      type: quest.type,
      targetValue: quest.targetValue,
      rewardPoints: quest.rewardPoints,
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order': return 'Заказ';
      case 'spend': return 'Потратить';
      case 'visit': return 'Посещение';
      case 'referral': return 'Реферал';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-700';
      case 'spend': return 'bg-green-100 text-green-700';
      case 'visit': return 'bg-purple-100 text-purple-700';
      case 'referral': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Ежедневные задания</h1>
                <p className="text-sm text-gray-500">Управление квестами</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                {seedMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                Создать базовые
              </Button>
              <Button 
                variant="outline" 
                onClick={() => notifyMutation.mutate()}
                disabled={notifyMutation.isPending}
                className="bg-amber-50 hover:bg-amber-100 border-amber-200"
              >
                {notifyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4 mr-2" />
                )}
                Уведомить всех
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новое задание</DialogTitle>
                    <DialogDescription>
                      Создайте новое ежедневное задание для пользователей
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Ключ задания</Label>
                      <Input
                        placeholder="daily_order_3"
                        value={formData.questKey}
                        onChange={(e) => setFormData({ ...formData, questKey: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Название</Label>
                      <Input
                        placeholder="Сделайте 3 заказа"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Описание</Label>
                      <Input
                        placeholder="Сделайте 3 любых заказа сегодня"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Тип</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({ ...formData, type: value as Quest['type'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="order">Заказ</SelectItem>
                            <SelectItem value="spend">Потратить</SelectItem>
                            <SelectItem value="visit">Посещение</SelectItem>
                            <SelectItem value="referral">Реферал</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Цель</Label>
                        <Input
                          type="number"
                          value={formData.targetValue}
                          onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Награда (баллы)</Label>
                      <Input
                        type="number"
                        value={formData.rewardPoints}
                        onChange={(e) => setFormData({ ...formData, rewardPoints: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Создать
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : !quests || quests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет заданий</h3>
              <p className="text-gray-500 mb-4">
                Создайте базовые задания или добавьте новые
              </p>
              <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                {seedMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                Создать базовые задания
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quests.map((quest) => (
              <Card key={quest.id} className={!quest.isActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Target className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{quest.title}</CardTitle>
                        <CardDescription>{quest.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(quest.type)}>
                        {getTypeLabel(quest.type)}
                      </Badge>
                      {!quest.isActive && (
                        <Badge variant="secondary">Неактивно</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Цель:</span> {quest.targetValue}
                        {quest.type === 'spend' && ' ₸'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Gift className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">{quest.rewardPoints.toLocaleString()}</span> баллов
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(quest)}
                      >
                        {quest.isActive ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(quest)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(quest.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingQuest} onOpenChange={(open) => !open && setEditingQuest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать задание</DialogTitle>
            <DialogDescription>
              Измените параметры задания
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Цель</Label>
                <Input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Награда (баллы)</Label>
                <Input
                  type="number"
                  value={formData.rewardPoints}
                  onChange={(e) => setFormData({ ...formData, rewardPoints: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuest(null)}>
              Отмена
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
