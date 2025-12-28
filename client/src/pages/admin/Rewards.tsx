/**
 * VendHub TWA - Admin Rewards Management
 */

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Gift,
  Coffee,
  Percent,
  Ticket,
  ArrowUpCircle,
  Star,
  Crown,
  Loader2,
  Sparkles,
  Package,
} from "lucide-react";

// Reward types
const rewardTypes = [
  { value: "bonus_points", label: "Бонусные баллы", icon: Star },
  { value: "promo_code", label: "Промокод", icon: Ticket },
  { value: "free_drink", label: "Бесплатный напиток", icon: Coffee },
  { value: "discount_percent", label: "Скидка %", icon: Percent },
  { value: "discount_fixed", label: "Фиксированная скидка", icon: Ticket },
  { value: "custom", label: "Другое", icon: Gift },
];

// Type colors
const typeColors: Record<string, string> = {
  bonus_points: "bg-yellow-500",
  promo_code: "bg-blue-500",
  free_drink: "bg-amber-500",
  discount_percent: "bg-green-500",
  discount_fixed: "bg-purple-500",
  custom: "bg-gray-500",
};

// Format points
function formatPoints(points: number): string {
  return points.toLocaleString('ru-RU');
}

export default function AdminRewards() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [deletingReward, setDeletingReward] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    nameRu: "",
    description: "",
    descriptionRu: "",
    rewardType: "bonus_points",
    pointsCost: 0,
    pointsAwarded: 0,
    promoCode: "",
    stockLimit: null as number | null,
    isActive: true,
    isFeatured: false,
  });
  
  // Fetch rewards
  const { data: rewards, isLoading, refetch } = trpc.rewards.adminList.useQuery();
  
  // Mutations
  const createMutation = trpc.rewards.adminCreate.useMutation({
    onSuccess: () => {
      toast.success("Награда создана");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });
  
  const updateMutation = trpc.rewards.adminUpdate.useMutation({
    onSuccess: () => {
      toast.success("Награда обновлена");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });
  
  const deleteMutation = trpc.rewards.adminDelete.useMutation({
    onSuccess: () => {
      toast.success("Награда удалена");
      refetch();
      setIsDeleteDialogOpen(false);
      setDeletingReward(null);
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });
  
  const resetForm = () => {
    setFormData({
      name: "",
      nameRu: "",
      description: "",
      descriptionRu: "",
      rewardType: "bonus_points",
      pointsCost: 0,
      pointsAwarded: 0,
      promoCode: "",
      stockLimit: null,
      isActive: true,
      isFeatured: false,
    });
    setEditingReward(null);
  };
  
  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  
  const handleEdit = (reward: any) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      nameRu: reward.nameRu || "",
      description: reward.description || "",
      descriptionRu: reward.descriptionRu || "",
      rewardType: reward.rewardType,
      pointsCost: reward.pointsCost,
      pointsAwarded: reward.pointsAwarded || 0,
      promoCode: reward.promoCode || "",
      stockLimit: reward.stockLimit,
      isActive: reward.isActive,
      isFeatured: reward.isFeatured,
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = (reward: any) => {
    setDeletingReward(reward);
    setIsDeleteDialogOpen(true);
  };
  
  const handleSubmit = () => {
    if (!formData.name || !formData.nameRu) {
      toast.error("Заполните название на обоих языках");
      return;
    }
    
    if (editingReward) {
      updateMutation.mutate({ 
        id: editingReward.id, 
        data: {
          name: formData.name,
          nameRu: formData.nameRu,
          description: formData.description,
          descriptionRu: formData.descriptionRu,
          pointsCost: formData.pointsCost,
          pointsAwarded: formData.pointsAwarded || undefined,
          promoCode: formData.promoCode || undefined,
          stockLimit: formData.stockLimit || undefined,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
        }
      });
    } else {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      createMutation.mutate({
        slug,
        name: formData.name,
        nameRu: formData.nameRu,
        description: formData.description,
        descriptionRu: formData.descriptionRu,
        rewardType: formData.rewardType as 'bonus_points' | 'promo_code' | 'free_drink' | 'discount_percent' | 'discount_fixed' | 'custom',
        pointsCost: formData.pointsCost,
        pointsAwarded: formData.pointsAwarded || undefined,
        promoCode: formData.promoCode || undefined,
        stockLimit: formData.stockLimit || undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      });
    }
  };
  
  const getTypeIcon = (type: string) => {
    const typeInfo = rewardTypes.find(t => t.value === type);
    if (!typeInfo) return <Gift className="h-4 w-4" />;
    const Icon = typeInfo.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <AdminLayout title="Награды" description="Управление магазином наград">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {rewards?.length || 0} наград
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить награду
            </Button>
          </div>
        </div>

        {/* Rewards Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rewards?.length === 0 ? (
            <div className="p-8 text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Нет наград</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Создайте первую награду или загрузите базовые
              </p>
              <div className="flex items-center justify-center gap-2">
                
                <Button onClick={handleCreate}>
                  Добавить награду
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Награда</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Стоимость</TableHead>
                  <TableHead>Срок</TableHead>
                  <TableHead>Лимит</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards?.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${typeColors[reward.rewardType]}`}>
                          {getTypeIcon(reward.rewardType)}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {reward.nameRu || reward.name}
                            {reward.isFeatured && (
                              <Sparkles className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {reward.descriptionRu || reward.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rewardTypes.find(t => t.value === reward.rewardType)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500" />
                        {formatPoints(reward.pointsCost)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reward.pointsAwarded && reward.pointsAwarded > 0 && (
                        <span className="text-green-600">+{formatPoints(reward.pointsAwarded)}</span>
                      )}
                      {reward.promoCode && (
                        <code className="text-xs bg-muted px-1 rounded">{reward.promoCode}</code>
                      )}
                    </TableCell>
                    <TableCell>
                      {reward.stockLimit ? (
                        <span>
                          {reward.stockRemaining}/{reward.stockLimit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">∞</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reward.isActive ? "default" : "secondary"}>
                        {reward.isActive ? "Активна" : "Неактивна"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(reward)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(reward)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReward ? "Редактировать награду" : "Новая награда"}
            </DialogTitle>
            <DialogDescription>
              {editingReward ? "Измените параметры награды" : "Создайте новую награду для магазина"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название (EN)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Free Coffee"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameRu">Название (RU) *</Label>
                <Input
                  id="nameRu"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  placeholder="Бесплатный кофе"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Описание (EN)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Get a free coffee of your choice"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionRu">Описание (RU)</Label>
                <Textarea
                  id="descriptionRu"
                  value={formData.descriptionRu}
                  onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
                  placeholder="Получите бесплатный кофе на выбор"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rewardType">Тип награды</Label>
                <Select
                  value={formData.rewardType}
                  onValueChange={(value) => setFormData({ ...formData, rewardType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rewardTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsCost">Стоимость (баллы)</Label>
                <Input
                  id="pointsCost"
                  type="number"
                  value={formData.pointsCost}
                  onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) || 0 })}
                  min={0}
                  placeholder="0 = бесплатно"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pointsAwarded">Начисляемые баллы (1 балл = 1 сум)</Label>
                <Input
                  id="pointsAwarded"
                  type="number"
                  value={formData.pointsAwarded}
                  onChange={(e) => setFormData({ ...formData, pointsAwarded: parseInt(e.target.value) || 0 })}
                  min={0}
                  placeholder="Количество баллов"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promoCode">Промокод (для ввода на автомате)</Label>
                <Input
                  id="promoCode"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                  placeholder="COFFEE2024"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stockLimit">Лимит (пусто = ∞)</Label>
              <Input
                id="stockLimit"
                type="number"
                value={formData.stockLimit || ""}
                onChange={(e) => setFormData({ ...formData, stockLimit: e.target.value ? parseInt(e.target.value) : null })}
                min={1}
                placeholder="∞"
              />
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Активна</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
                <Label htmlFor="isFeatured">Популярная</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingReward ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить награду?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить награду "{deletingReward?.nameRu || deletingReward?.name}"?
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingReward && deleteMutation.mutate({ id: deletingReward.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
