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
  { value: "free_drink", label: "Бесплатный напиток", icon: Coffee },
  { value: "discount_percent", label: "Скидка %", icon: Percent },
  { value: "discount_fixed", label: "Фиксированная скидка", icon: Ticket },
  { value: "free_upgrade", label: "Бесплатный апгрейд", icon: ArrowUpCircle },
  { value: "bonus_points", label: "Бонусные баллы", icon: Star },
  { value: "exclusive_item", label: "Эксклюзив", icon: Crown },
  { value: "custom", label: "Другое", icon: Gift },
];

// Type colors
const typeColors: Record<string, string> = {
  free_drink: "bg-amber-500",
  discount_percent: "bg-green-500",
  discount_fixed: "bg-blue-500",
  free_upgrade: "bg-purple-500",
  bonus_points: "bg-yellow-500",
  exclusive_item: "bg-pink-500",
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
    rewardType: "free_drink",
    pointsCost: 500,
    rewardValue: "",
    validityDays: 30,
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
      rewardType: "free_drink",
      pointsCost: 500,
      rewardValue: "",
      validityDays: 30,
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
      rewardValue: reward.rewardValue || "",
      validityDays: reward.validityDays,
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
          stockLimit: formData.stockLimit || undefined,
          validityDays: formData.validityDays,
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
        rewardType: formData.rewardType as 'free_drink' | 'discount_percent' | 'discount_fixed' | 'free_upgrade' | 'bonus_points' | 'exclusive_item' | 'custom',
        pointsCost: formData.pointsCost,
        stockLimit: formData.stockLimit || undefined,
        validityDays: formData.validityDays,
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
                    <TableCell>{reward.validityDays} дней</TableCell>
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
                <Label htmlFor="rewardValue">Значение награды</Label>
                <Input
                  id="rewardValue"
                  value={formData.rewardValue}
                  onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value })}
                  placeholder="10% / 5000 / любой напиток"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pointsCost">Стоимость (баллы) *</Label>
                <Input
                  id="pointsCost"
                  type="number"
                  value={formData.pointsCost}
                  onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validityDays">Срок действия (дни)</Label>
                <Input
                  id="validityDays"
                  type="number"
                  value={formData.validityDays}
                  onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) || 30 })}
                  min={1}
                />
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
