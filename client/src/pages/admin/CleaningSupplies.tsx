import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type CleaningSupply = {
  id: number;
  name: string;
  category: "detergent" | "descaler" | "sanitizer" | "wipes" | "brush" | "other";
  unit: string;
  currentStock: number;
  minStock: number;
  usagePerCleaning: number;
  costPerUnit: number;
};

const categoryLabels: Record<string, string> = {
  detergent: "Моющее средство",
  descaler: "Декальцинатор",
  sanitizer: "Дезинфектор",
  wipes: "Салфетки",
  brush: "Щётки",
  other: "Другое",
};

const categoryIcons: Record<string, string> = {
  detergent: "🧴",
  descaler: "💧",
  sanitizer: "🧪",
  wipes: "🧻",
  brush: "🪥",
  other: "📦",
};

const mockSupplies: CleaningSupply[] = [
  { id: 1, name: "Средство для очистки молочной системы", category: "detergent", unit: "л", currentStock: 5, minStock: 2, usagePerCleaning: 0.1, costPerUnit: 35000 },
  { id: 2, name: "Декальцинатор Delonghi", category: "descaler", unit: "л", currentStock: 3, minStock: 2, usagePerCleaning: 0.25, costPerUnit: 45000 },
  { id: 3, name: "Таблетки для очистки", category: "detergent", unit: "шт", currentStock: 50, minStock: 20, usagePerCleaning: 1, costPerUnit: 2000 },
  { id: 4, name: "Дезинфицирующие салфетки", category: "wipes", unit: "шт", currentStock: 200, minStock: 100, usagePerCleaning: 5, costPerUnit: 500 },
  { id: 5, name: "Щётка для группы", category: "brush", unit: "шт", currentStock: 8, minStock: 5, usagePerCleaning: 0, costPerUnit: 15000 },
  { id: 6, name: "Санитайзер для поверхностей", category: "sanitizer", unit: "л", currentStock: 2, minStock: 3, usagePerCleaning: 0.05, costPerUnit: 25000 },
];

export default function CleaningSuppliesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<CleaningSupply | null>(null);
  const [supplies, setSupplies] = useState<CleaningSupply[]>(mockSupplies);
  const [formData, setFormData] = useState({
    name: "",
    category: "detergent" as CleaningSupply["category"],
    unit: "л",
    currentStock: 0,
    minStock: 0,
    usagePerCleaning: 0,
    costPerUnit: 0,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "detergent",
      unit: "л",
      currentStock: 0,
      minStock: 0,
      usagePerCleaning: 0,
      costPerUnit: 0,
    });
  };

  const handleEdit = (supply: CleaningSupply) => {
    setEditingSupply(supply);
    setFormData({
      name: supply.name,
      category: supply.category,
      unit: supply.unit,
      currentStock: supply.currentStock,
      minStock: supply.minStock,
      usagePerCleaning: supply.usagePerCleaning,
      costPerUnit: supply.costPerUnit,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupply) {
      setSupplies(supplies.map(s => 
        s.id === editingSupply.id ? { ...s, ...formData } : s
      ));
      toast.success("Средство обновлено");
    } else {
      const newSupply: CleaningSupply = {
        id: Math.max(...supplies.map(s => s.id)) + 1,
        ...formData,
      };
      setSupplies([...supplies, newSupply]);
      toast.success("Средство добавлено");
    }
    setIsDialogOpen(false);
    setEditingSupply(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить средство?")) {
      setSupplies(supplies.filter(s => s.id !== id));
      toast.success("Средство удалено");
    }
  };

  const lowStockCount = supplies.filter(s => s.currentStock <= s.minStock).length;

  return (
    <AdminLayout title="Чистящие средства" description="Управление запасами чистящих средств">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockCount} низкий запас
            </Badge>
          )}
          <div className="flex-1" />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingSupply(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSupply ? "Редактировать средство" : "Новое средство"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Название *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as CleaningSupply["category"] })}
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
                    <Label>Единица</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="л">л</SelectItem>
                        <SelectItem value="шт">шт</SelectItem>
                        <SelectItem value="мл">мл</SelectItem>
                        <SelectItem value="уп">уп</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Текущий запас</Label>
                    <Input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Мин. запас</Label>
                    <Input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Расход на чистку</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.usagePerCleaning}
                      onChange={(e) => setFormData({ ...formData, usagePerCleaning: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Цена (UZS)</Label>
                    <Input
                      type="number"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingSupply ? "Сохранить" : "Добавить"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {supplies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет чистящих средств</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {supplies.map((supply) => {
              const isLowStock = supply.currentStock <= supply.minStock;
              const cleaningsLeft = supply.usagePerCleaning > 0 
                ? Math.floor(supply.currentStock / supply.usagePerCleaning)
                : null;
              
              return (
                <Card key={supply.id} className={isLowStock ? "border-destructive" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{categoryIcons[supply.category]}</span>
                        <div>
                          <h3 className="font-semibold text-sm">{supply.name}</h3>
                          <p className="text-xs text-muted-foreground">{categoryLabels[supply.category]}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(supply)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supply.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Запас</span>
                        <span className={isLowStock ? "text-destructive font-medium" : ""}>
                          {supply.currentStock} {supply.unit}
                        </span>
                      </div>
                      {isLowStock && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Низкий запас (мин: {supply.minStock} {supply.unit})
                        </div>
                      )}
                      {cleaningsLeft !== null && (
                        <p className="text-xs text-muted-foreground">
                          Хватит на ~{cleaningsLeft} чисток
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      {supply.costPerUnit.toLocaleString()} UZS/{supply.unit}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
