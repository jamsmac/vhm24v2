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
import { Plus, Pencil, Trash2, Wrench, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";

type SparePart = {
  id: number;
  name: string;
  sku: string;
  category: "grinder" | "pump" | "valve" | "seal" | "filter" | "motor" | "sensor" | "display" | "other";
  compatibleModels: string[];
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplier: string | null;
  leadTimeDays: number;
};

const categoryLabels: Record<string, string> = {
  grinder: "Кофемолка",
  pump: "Помпа",
  valve: "Клапан",
  seal: "Уплотнитель",
  filter: "Фильтр",
  motor: "Мотор",
  sensor: "Датчик",
  display: "Дисплей",
  other: "Другое",
};

const mockParts: SparePart[] = [
  { id: 1, name: "Жернова кофемолки 64мм", sku: "GRN-64-001", category: "grinder", compatibleModels: ["Saeco", "Necta"], currentStock: 5, minStock: 2, costPerUnit: 150000, supplier: "TechParts", leadTimeDays: 14 },
  { id: 2, name: "Помпа ULKA EP5", sku: "PMP-EP5-001", category: "pump", compatibleModels: ["Saeco", "Delonghi"], currentStock: 3, minStock: 2, costPerUnit: 85000, supplier: "TechParts", leadTimeDays: 7 },
  { id: 3, name: "Электромагнитный клапан 3-ходовой", sku: "VLV-3W-001", category: "valve", compatibleModels: ["Necta", "Bianchi"], currentStock: 4, minStock: 3, costPerUnit: 120000, supplier: null, leadTimeDays: 21 },
  { id: 4, name: "Уплотнительное кольцо группы", sku: "SEL-GRP-001", category: "seal", compatibleModels: ["Saeco", "Necta", "Bianchi"], currentStock: 20, minStock: 10, costPerUnit: 5000, supplier: "TechParts", leadTimeDays: 3 },
  { id: 5, name: "Фильтр воды", sku: "FLT-WTR-001", category: "filter", compatibleModels: ["Universal"], currentStock: 8, minStock: 5, costPerUnit: 35000, supplier: "AquaFilter", leadTimeDays: 5 },
  { id: 6, name: "Датчик уровня воды", sku: "SNS-WTR-001", category: "sensor", compatibleModels: ["Necta", "Bianchi"], currentStock: 2, minStock: 3, costPerUnit: 45000, supplier: null, leadTimeDays: 14 },
  { id: 7, name: "Мотор миксера", sku: "MTR-MIX-001", category: "motor", compatibleModels: ["Necta"], currentStock: 1, minStock: 2, costPerUnit: 180000, supplier: "TechParts", leadTimeDays: 21 },
];

export default function SparePartsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [parts, setParts] = useState<SparePart[]>(mockParts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "other" as SparePart["category"],
    compatibleModels: "",
    currentStock: 0,
    minStock: 0,
    costPerUnit: 0,
    supplier: "",
    leadTimeDays: 7,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "other",
      compatibleModels: "",
      currentStock: 0,
      minStock: 0,
      costPerUnit: 0,
      supplier: "",
      leadTimeDays: 7,
    });
  };

  const handleEdit = (part: SparePart) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      sku: part.sku,
      category: part.category,
      compatibleModels: part.compatibleModels.join(", "),
      currentStock: part.currentStock,
      minStock: part.minStock,
      costPerUnit: part.costPerUnit,
      supplier: part.supplier || "",
      leadTimeDays: part.leadTimeDays,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const partData = {
      ...formData,
      compatibleModels: formData.compatibleModels.split(",").map(m => m.trim()).filter(Boolean),
      supplier: formData.supplier || null,
    };
    
    if (editingPart) {
      setParts(parts.map(p => 
        p.id === editingPart.id ? { ...p, ...partData } : p
      ));
      toast.success("Запчасть обновлена");
    } else {
      const newPart: SparePart = {
        id: Math.max(...parts.map(p => p.id)) + 1,
        ...partData,
      };
      setParts([...parts, newPart]);
      toast.success("Запчасть добавлена");
    }
    setIsDialogOpen(false);
    setEditingPart(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить запчасть?")) {
      setParts(parts.filter(p => p.id !== id));
      toast.success("Запчасть удалена");
    }
  };

  const filteredParts = parts.filter(p => {
    const matchesSearch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = parts.filter(p => p.currentStock <= p.minStock).length;

  return (
    <AdminLayout title="Запчасти" description="Управление запасами запчастей">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию или SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
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
              setEditingPart(null);
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
                  {editingPart ? "Редактировать запчасть" : "Новая запчасть"}
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
                    <Label>Артикул (SKU) *</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as SparePart["category"] })}
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
                </div>
                <div className="space-y-2">
                  <Label>Совместимые модели</Label>
                  <Input
                    value={formData.compatibleModels}
                    onChange={(e) => setFormData({ ...formData, compatibleModels: e.target.value })}
                    placeholder="Saeco, Necta, Bianchi"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Текущий запас</Label>
                    <Input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Мин. запас</Label>
                    <Input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Цена (UZS)</Label>
                    <Input
                      type="number"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Срок поставки (дней)</Label>
                    <Input
                      type="number"
                      value={formData.leadTimeDays}
                      onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Поставщик</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingPart ? "Сохранить" : "Добавить"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет запчастей</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredParts.map((part) => {
              const isLowStock = part.currentStock <= part.minStock;
              
              return (
                <Card key={part.id} className={isLowStock ? "border-destructive" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{part.sku}</Badge>
                          <Badge variant="secondary" className="text-xs">{categoryLabels[part.category]}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm">{part.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(part)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(part.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Запас</span>
                        <span className={isLowStock ? "text-destructive font-medium" : ""}>
                          {part.currentStock} шт
                        </span>
                      </div>
                      {isLowStock && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Низкий запас (мин: {part.minStock} шт)
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {part.compatibleModels.map((model, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{model}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t flex justify-between text-sm text-muted-foreground">
                      <span>{part.costPerUnit.toLocaleString()} UZS</span>
                      <span>{part.leadTimeDays} дней</span>
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
