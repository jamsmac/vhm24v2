/**
 * Admin Promo Codes Management Page
 * CRUD operations for promotional codes
 */

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  Percent,
  Calendar,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface PromoCode {
  id: number;
  code: string;
  discountPercent: number;
  minOrderAmount: number;
  maxUses: number | null;
  currentUses: number;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

interface PromoFormData {
  code: string;
  discountPercent: number;
  minOrderAmount: number;
  maxUses: number | null;
  expiresAt: string;
  isActive: boolean;
}

const defaultFormData: PromoFormData = {
  code: "",
  discountPercent: 10,
  minOrderAmount: 0,
  maxUses: null,
  expiresAt: "",
  isActive: true,
};

export default function AdminPromoCodes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<PromoFormData>(defaultFormData);

  const { data: promoCodes, refetch } = trpc.admin.promo.list.useQuery();

  // Mutations
  const createMutation = trpc.admin.promo.create.useMutation({
    onSuccess: () => {
      toast.success("Промокод создан");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const updateMutation = trpc.admin.promo.update.useMutation({
    onSuccess: () => {
      toast.success("Промокод обновлён");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteMutation = trpc.admin.promo.delete.useMutation({
    onSuccess: () => {
      toast.success("Промокод удалён");
      refetch();
      setIsDeleteDialogOpen(false);
      setDeletingPromo(null);
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingPromo(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discountPercent: promo.discountPercent,
      minOrderAmount: promo.minOrderAmount,
      maxUses: promo.maxUses,
      expiresAt: promo.expiresAt ? format(new Date(promo.expiresAt), "yyyy-MM-dd") : "",
      isActive: promo.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (promo: PromoCode) => {
    setDeletingPromo(promo);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code || formData.discountPercent <= 0) {
      toast.error("Заполните обязательные поля");
      return;
    }

    const submitData = {
      code: formData.code.toUpperCase(),
      discountPercent: formData.discountPercent,
      minOrderAmount: formData.minOrderAmount,
      maxUses: formData.maxUses || undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
    };

    if (editingPromo) {
      updateMutation.mutate({
        id: editingPromo.id,
        ...submitData,
        isActive: formData.isActive,
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const confirmDelete = () => {
    if (deletingPromo) {
      deleteMutation.mutate({ id: deletingPromo.id });
    }
  };

  // Filter promo codes
  const filteredPromoCodes = promoCodes?.filter((promo) => {
    return promo.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' UZS';
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return format(new Date(date), "dd MMM yyyy", { locale: ru });
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExhausted = (promo: PromoCode) => {
    if (!promo.maxUses) return false;
    return promo.currentUses >= promo.maxUses;
  };

  return (
    <AdminLayout title="Промокоды" description="Управление промокодами и скидками">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск по коду..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Добавить промокод
        </Button>
      </div>

      {/* Promo Codes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>Скидка</TableHead>
                <TableHead>Мин. сумма</TableHead>
                <TableHead>Использований</TableHead>
                <TableHead>Срок действия</TableHead>
                <TableHead className="text-center">Статус</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromoCodes?.map((promo) => {
                const expired = isExpired(promo.expiresAt);
                const exhausted = isExhausted(promo as PromoCode);
                const active = promo.isActive && !expired && !exhausted;
                
                return (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <Tag className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                          {promo.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <Percent className="w-4 h-4" />
                        {promo.discountPercent}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {(promo.minOrderAmount ?? 0) > 0 ? formatCurrency(promo.minOrderAmount ?? 0) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        {promo.currentUses}
                        {promo.maxUses && ` / ${promo.maxUses}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(promo.expiresAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {!promo.isActive ? (
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          Отключён
                        </Badge>
                      ) : expired ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Истёк
                        </Badge>
                      ) : exhausted ? (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          Исчерпан
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Активен
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(promo as PromoCode)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(promo as PromoCode)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPromoCodes?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Промокоды не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? "Редактировать промокод" : "Добавить промокод"}
            </DialogTitle>
            <DialogDescription>
              {editingPromo ? "Измените данные промокода" : "Создайте новый промокод"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Код *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="COFFEE10"
                className="font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPercent">Скидка (%) *</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minOrderAmount">Мин. сумма (UZS)</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Макс. использований</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={formData.maxUses || ""}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Без ограничений"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Срок действия</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>

            {editingPromo && (
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Промокод активен</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {createMutation.isPending || updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить промокод?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить промокод "{deletingPromo?.code}"? 
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
