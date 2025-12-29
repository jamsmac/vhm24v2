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
import { Plus, Pencil, Trash2, Coffee, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Ingredient = {
  id: number;
  name: string;
  category: "coffee" | "milk" | "sugar" | "syrup" | "powder" | "water" | "other";
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit: number;
  supplier: string | null;
};

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

// Mock data for now
const mockIngredients: Ingredient[] = [
  { id: 1, name: "Арабика 100%", category: "coffee", unit: "кг", currentStock: 15, minStock: 5, maxStock: 50, costPerUnit: 45000, supplier: "CoffeeTrade" },
  { id: 2, name: "Робуста", category: "coffee", unit: "кг", currentStock: 8, minStock: 5, maxStock: 30, costPerUnit: 35000, supplier: "CoffeeTrade" },
  { id: 3, name: "Молоко 3.2%", category: "milk", unit: "л", currentStock: 25, minStock: 10, maxStock: 100, costPerUnit: 12000, supplier: "Лактис" },
  { id: 4, name: "Сливки 10%", category: "milk", unit: "л", currentStock: 5, minStock: 5, maxStock: 30, costPerUnit: 18000, supplier: "Лактис" },
  { id: 5, name: "Сахар белый", category: "sugar", unit: "кг", currentStock: 20, minStock: 10, maxStock: 50, costPerUnit: 8000, supplier: null },
  { id: 6, name: "Ванильный сироп", category: "syrup", unit: "л", currentStock: 3, minStock: 2, maxStock: 20, costPerUnit: 25000, supplier: "Monin" },
  { id: 7, name: "Карамельный сироп", category: "syrup", unit: "л", currentStock: 4, minStock: 2, maxStock: 20, costPerUnit: 25000, supplier: "Monin" },
  { id: 8, name: "Какао порошок", category: "powder", unit: "кг", currentStock: 2, minStock: 3, maxStock: 15, costPerUnit: 55000, supplier: null },
];

export default function IngredientsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>(mockIngredients);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [formData, setFormData] = useState({
    name: "",
    category: "coffee" as Ingredient["category"],
    unit: "кг",
    currentStock: 0,
    minStock: 0,
    maxStock: 100,
    costPerUnit: 0,
    supplier: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "coffee",
      unit: "кг",
      currentStock: 0,
      minStock: 0,
      maxStock: 100,
      costPerUnit: 0,
      supplier: "",
    });
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      minStock: ingredient.minStock,
      maxStock: ingredient.maxStock,
      costPerUnit: ingredient.costPerUnit,
      supplier: ingredient.supplier || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIngredient) {
      setIngredients(ingredients.map(i => 
        i.id === editingIngredient.id 
          ? { ...i, ...formData, supplier: formData.supplier || null }
          : i
      ));
      toast.success("Ингредиент обновлён");
    } else {
      const newIngredient: Ingredient = {
        id: Math.max(...ingredients.map(i => i.id)) + 1,
        ...formData,
        supplier: formData.supplier || null,
      };
      setIngredients([...ingredients, newIngredient]);
      toast.success("Ингредиент добавлен");
    }
    setIsDialogOpen(false);
    setEditingIngredient(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить ингредиент?")) {
      setIngredients(ingredients.filter(i => i.id !== id));
      toast.success("Ингредиент удалён");
    }
  };

  const filteredIngredients = filterCategory === "all" 
    ? ingredients 
    : ingredients.filter(i => i.category === filterCategory);

  const lowStockCount = ingredients.filter(i => i.currentStock <= i.minStock).length;

  return (
    <AdminLayout title="Ингредиенты" description="Управление запасами ингредиентов">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
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
              {lowStockCount} низкий запас
            </Badge>
          )}

          <div className="flex-1" />

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingIngredient(null);
              resetForm();
            }
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
                  {editingIngredient ? "Редактировать ингредиент" : "Новый ингредиент"}
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
                      onValueChange={(value) => setFormData({ ...formData, category: value as Ingredient["category"] })}
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
                        <SelectItem value="кг">кг</SelectItem>
                        <SelectItem value="л">л</SelectItem>
                        <SelectItem value="шт">шт</SelectItem>
                        <SelectItem value="г">г</SelectItem>
                        <SelectItem value="мл">мл</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <Label>Макс. запас</Label>
                    <Input
                      type="number"
                      value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Цена за единицу (UZS)</Label>
                  <Input
                    type="number"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Поставщик</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Название поставщика"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingIngredient ? "Сохранить" : "Добавить"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {filteredIngredients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет ингредиентов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIngredients.map((ingredient) => {
              const isLowStock = ingredient.currentStock <= ingredient.minStock;
              const stockPercent = Math.min((ingredient.currentStock / ingredient.maxStock) * 100, 100);
              
              return (
                <Card key={ingredient.id} className={isLowStock ? "border-destructive" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
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
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(ingredient.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Запас</span>
                        <span className={isLowStock ? "text-destructive font-medium" : ""}>
                          {ingredient.currentStock} / {ingredient.maxStock} {ingredient.unit}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${isLowStock ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${stockPercent}%` }}
                        />
                      </div>
                      {isLowStock && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Низкий запас (мин: {ingredient.minStock} {ingredient.unit})
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t flex justify-between text-sm text-muted-foreground">
                      <span>{ingredient.costPerUnit.toLocaleString()} UZS/{ingredient.unit}</span>
                      {ingredient.supplier && <span>{ingredient.supplier}</span>}
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
