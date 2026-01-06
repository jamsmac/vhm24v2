import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Package, AlertTriangle, Loader2, CheckSquare, XSquare, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type IngredientCategory = "coffee" | "milk" | "sugar" | "syrup" | "powder" | "water" | "other";

const categoryLabels: Record<string, string> = {
  coffee: "Кофе",
  milk: "Молоко",
  sugar: "Сахар",
  syrup: "Сироп",
  powder: "Порошок",
  water: "Вода",
  other: "Другое",
};

const categoryIcons: Record<string, string> = {
  coffee: "☕",
  milk: "🥛",
  sugar: "🍬",
  syrup: "🍯",
  powder: "🧂",
  water: "💧",
  other: "📦",
};

export default function IngredientsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "coffee" as IngredientCategory,
    unit: "g",
    costPerUnit: 0,
    minStockLevel: 100,
    description: "",
    isActive: true,
  });

  // Fetch ingredients from API
  const { data: ingredients = [], isLoading, refetch } = trpc.admin.ingredients.list.useQuery();
  
  // Mutations
  const createMutation = trpc.admin.ingredients.create.useMutation({
    onSuccess: () => {
      toast.success("Ингредиент добавлен");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const updateMutation = trpc.admin.ingredients.update.useMutation({
    onSuccess: () => {
      toast.success("Ингредиент обновлён");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.ingredients.delete.useMutation({
    onSuccess: () => {
      toast.success("Ингредиент удалён");
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.admin.ingredients.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Удалено ${data.count} ингредиентов`);
      setSelectedIds(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const bulkStatusMutation = trpc.admin.ingredients.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Обновлено ${data.count} ингредиентов`);
      setSelectedIds(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "coffee",
      unit: "g",
      costPerUnit: 0,
      minStockLevel: 100,
      description: "",
      isActive: true,
    });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (ingredient: typeof ingredients[0]) => {
    setEditingId(ingredient.id);
    setFormData({
      name: ingredient.name,
      category: ingredient.category as IngredientCategory,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      minStockLevel: ingredient.minStockLevel,
      description: ingredient.description || "",
      isActive: ingredient.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Введите название ингредиента");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        description: formData.description || undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        description: formData.description || undefined,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить ингредиент?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Bulk selection handlers
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredIngredients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIngredients.map(i => i.id)));
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate({ ids: Array.from(selectedIds) });
    setShowDeleteConfirm(false);
  };

  const handleBulkActivate = () => {
    bulkStatusMutation.mutate({ ids: Array.from(selectedIds), isActive: true });
  };

  const handleBulkDeactivate = () => {
    bulkStatusMutation.mutate({ ids: Array.from(selectedIds), isActive: false });
  };

  const filteredIngredients = filterCategory === "all" 
    ? ingredients 
    : ingredients.filter(i => i.category === filterCategory);

  const lowStockCount = ingredients.filter(i => !i.isActive).length;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isBulkProcessing = bulkDeleteMutation.isPending || bulkStatusMutation.isPending;
  const hasSelection = selectedIds.size > 0;
  const allSelected = filteredIngredients.length > 0 && selectedIds.size === filteredIngredients.length;

  return (
    <AdminLayout title="Ингредиенты" description="Управление запасами ингредиентов">
      <div className="space-y-6">
        {/* Bulk Action Toolbar */}
        {hasSelection && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <span className="font-medium">Выбрано: {selectedIds.size}</span>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkActivate}
                    disabled={isBulkProcessing}
                    className="gap-1"
                  >
                    <Power className="h-4 w-4" />
                    Активировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDeactivate}
                    disabled={isBulkProcessing}
                    className="gap-1"
                  >
                    <PowerOff className="h-4 w-4" />
                    Деактивировать
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isBulkProcessing}
                    className="gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                    className="gap-1"
                  >
                    <XSquare className="h-4 w-4" />
                    Отменить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-4">
          {/* Select All Checkbox */}
          {filteredIngredients.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="selectAll"
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
              <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                Выбрать все
              </Label>
            </div>
          )}

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {categoryIcons[value]} {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {lowStockCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockCount} неактивных
            </Badge>
          )}

          <div className="flex-1" />

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) closeDialog();
            else setIsDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Редактировать ингредиент" : "Новый ингредиент"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Название *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Арабика 100%"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as IngredientCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Единица измерения</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">грамм (г)</SelectItem>
                        <SelectItem value="kg">килограмм (кг)</SelectItem>
                        <SelectItem value="ml">миллилитр (мл)</SelectItem>
                        <SelectItem value="l">литр (л)</SelectItem>
                        <SelectItem value="pcs">штук (шт)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Цена за единицу (UZS)</Label>
                    <Input
                      type="number"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: parseInt(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Мин. уровень запаса</Label>
                    <Input
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Дополнительная информация об ингредиенте"
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Активен</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Сохранить" : "Добавить"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
              <p className="text-muted-foreground">Загрузка...</p>
            </CardContent>
          </Card>
        ) : filteredIngredients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет ингредиентов</p>
              <p className="text-sm text-muted-foreground mt-1">Добавьте первый ингредиент</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIngredients.map((ingredient) => {
              const isInactive = !ingredient.isActive;
              const isSelected = selectedIds.has(ingredient.id);
              
              return (
                <Card 
                  key={ingredient.id} 
                  className={cn(
                    "transition-all",
                    isInactive && "border-muted opacity-60",
                    isSelected && "ring-2 ring-primary border-primary"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(ingredient.id)}
                        />
                        <span className="text-2xl">{categoryIcons[ingredient.category]}</span>
                        <div>
                          <h3 className="font-semibold">{ingredient.name}</h3>
                          <p className="text-sm text-muted-foreground">{categoryLabels[ingredient.category]}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ingredient)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(ingredient.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Единица</span>
                        <span>{ingredient.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Мин. запас</span>
                        <span>{ingredient.minStockLevel}</span>
                      </div>
                      {ingredient.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ingredient.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {ingredient.costPerUnit.toLocaleString()} UZS/{ingredient.unit}
                      </span>
                      <Badge variant={ingredient.isActive ? "default" : "secondary"}>
                        {ingredient.isActive ? "Активен" : "Неактивен"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные ингредиенты?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить {selectedIds.size} ингредиентов. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
