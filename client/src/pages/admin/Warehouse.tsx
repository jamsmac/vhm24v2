import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { 
  Plus, Pencil, Trash2, Warehouse as WarehouseIcon, 
  ArrowUpRight, ArrowDownLeft, Package, MapPin 
} from "lucide-react";
import { toast } from "sonner";

type WarehouseZone = {
  id: number;
  name: string;
  code: string;
  type: "main" | "cold" | "chemicals" | "spare_parts";
  capacity: number;
  currentOccupancy: number;
  address: string;
};

type StockMovement = {
  id: number;
  type: "in" | "out" | "transfer";
  itemName: string;
  quantity: number;
  fromZone: string | null;
  toZone: string | null;
  reason: string;
  performedBy: string;
  createdAt: Date;
};

const zoneTypeLabels: Record<string, string> = {
  main: "Основной",
  cold: "Холодильный",
  chemicals: "Химия",
  spare_parts: "Запчасти",
};

const mockZones: WarehouseZone[] = [
  { id: 1, name: "Основной склад", code: "WH-001", type: "main", capacity: 1000, currentOccupancy: 650, address: "ул. Навои, 15" },
  { id: 2, name: "Холодильная камера", code: "WH-002", type: "cold", capacity: 200, currentOccupancy: 120, address: "ул. Навои, 15" },
  { id: 3, name: "Склад химии", code: "WH-003", type: "chemicals", capacity: 100, currentOccupancy: 45, address: "ул. Навои, 15" },
  { id: 4, name: "Склад запчастей", code: "WH-004", type: "spare_parts", capacity: 300, currentOccupancy: 180, address: "ул. Чиланзар, 8" },
];

const mockMovements: StockMovement[] = [
  { id: 1, type: "in", itemName: "Арабика 100%", quantity: 50, fromZone: null, toZone: "WH-001", reason: "Поставка от CoffeeTrade", performedBy: "Алишер К.", createdAt: new Date("2024-12-28T10:30:00") },
  { id: 2, type: "out", itemName: "Молоко 3.2%", quantity: 20, fromZone: "WH-002", toZone: null, reason: "Отгрузка на автоматы", performedBy: "Бахром Т.", createdAt: new Date("2024-12-28T09:15:00") },
  { id: 3, type: "transfer", itemName: "Фильтр воды", quantity: 10, fromZone: "WH-001", toZone: "WH-004", reason: "Перемещение на склад запчастей", performedBy: "Алишер К.", createdAt: new Date("2024-12-27T16:45:00") },
  { id: 4, type: "in", itemName: "Декальцинатор", quantity: 30, fromZone: null, toZone: "WH-003", reason: "Поставка", performedBy: "Бахром Т.", createdAt: new Date("2024-12-27T14:00:00") },
];

export default function WarehousePage() {
  const [zones, setZones] = useState<WarehouseZone[]>(mockZones);
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<WarehouseZone | null>(null);
  
  const [zoneFormData, setZoneFormData] = useState({
    name: "",
    code: "",
    type: "main" as WarehouseZone["type"],
    capacity: 0,
    currentOccupancy: 0,
    address: "",
  });

  const [movementFormData, setMovementFormData] = useState({
    type: "in" as StockMovement["type"],
    itemName: "",
    quantity: 0,
    fromZone: "",
    toZone: "",
    reason: "",
  });

  const resetZoneForm = () => {
    setZoneFormData({
      name: "",
      code: "",
      type: "main",
      capacity: 0,
      currentOccupancy: 0,
      address: "",
    });
  };

  const handleEditZone = (zone: WarehouseZone) => {
    setEditingZone(zone);
    setZoneFormData({
      name: zone.name,
      code: zone.code,
      type: zone.type,
      capacity: zone.capacity,
      currentOccupancy: zone.currentOccupancy,
      address: zone.address,
    });
    setIsZoneDialogOpen(true);
  };

  const handleSubmitZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingZone) {
      setZones(zones.map(z => 
        z.id === editingZone.id ? { ...z, ...zoneFormData } : z
      ));
      toast.success("Зона обновлена");
    } else {
      const newZone: WarehouseZone = {
        id: Math.max(...zones.map(z => z.id)) + 1,
        ...zoneFormData,
      };
      setZones([...zones, newZone]);
      toast.success("Зона добавлена");
    }
    setIsZoneDialogOpen(false);
    setEditingZone(null);
    resetZoneForm();
  };

  const handleDeleteZone = (id: number) => {
    if (confirm("Удалить зону?")) {
      setZones(zones.filter(z => z.id !== id));
      toast.success("Зона удалена");
    }
  };

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const newMovement: StockMovement = {
      id: Math.max(...movements.map(m => m.id)) + 1,
      ...movementFormData,
      fromZone: movementFormData.fromZone || null,
      toZone: movementFormData.toZone || null,
      performedBy: "Текущий пользователь",
      createdAt: new Date(),
    };
    setMovements([newMovement, ...movements]);
    toast.success("Движение зарегистрировано");
    setIsMovementDialogOpen(false);
    setMovementFormData({
      type: "in",
      itemName: "",
      quantity: 0,
      fromZone: "",
      toZone: "",
      reason: "",
    });
  };

  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const totalOccupancy = zones.reduce((sum, z) => sum + z.currentOccupancy, 0);

  return (
    <AdminLayout title="Склад" description="Управление складскими зонами и движением товаров">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <WarehouseIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Всего зон</p>
                  <p className="text-2xl font-bold">{zones.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Package className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Заполненность</p>
                  <p className="text-2xl font-bold">{Math.round((totalOccupancy / totalCapacity) * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ArrowDownLeft className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Приходов сегодня</p>
                  <p className="text-2xl font-bold">{movements.filter(m => m.type === "in").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <ArrowUpRight className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Расходов сегодня</p>
                  <p className="text-2xl font-bold">{movements.filter(m => m.type === "out").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="zones">
          <TabsList>
            <TabsTrigger value="zones">Зоны хранения</TabsTrigger>
            <TabsTrigger value="movements">Движения</TabsTrigger>
          </TabsList>

          <TabsContent value="zones" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isZoneDialogOpen} onOpenChange={(open) => {
                setIsZoneDialogOpen(open);
                if (!open) {
                  setEditingZone(null);
                  resetZoneForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Добавить зону
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingZone ? "Редактировать зону" : "Новая зона"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitZone} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Название *</Label>
                      <Input
                        value={zoneFormData.name}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Код</Label>
                        <Input
                          value={zoneFormData.code}
                          onChange={(e) => setZoneFormData({ ...zoneFormData, code: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Тип</Label>
                        <Select
                          value={zoneFormData.type}
                          onValueChange={(value) => setZoneFormData({ ...zoneFormData, type: value as WarehouseZone["type"] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(zoneTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Вместимость</Label>
                        <Input
                          type="number"
                          value={zoneFormData.capacity}
                          onChange={(e) => setZoneFormData({ ...zoneFormData, capacity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Текущая загрузка</Label>
                        <Input
                          type="number"
                          value={zoneFormData.currentOccupancy}
                          onChange={(e) => setZoneFormData({ ...zoneFormData, currentOccupancy: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Адрес</Label>
                      <Input
                        value={zoneFormData.address}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, address: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingZone ? "Сохранить" : "Добавить"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {zones.map((zone) => {
                const occupancyPercent = Math.round((zone.currentOccupancy / zone.capacity) * 100);
                const isNearFull = occupancyPercent >= 80;
                
                return (
                  <Card key={zone.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{zone.code}</Badge>
                            <Badge variant="secondary">{zoneTypeLabels[zone.type]}</Badge>
                          </div>
                          <h3 className="font-semibold">{zone.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {zone.address}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditZone(zone)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteZone(zone.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Заполненность</span>
                          <span className={isNearFull ? "text-orange-500 font-medium" : ""}>
                            {zone.currentOccupancy} / {zone.capacity} ({occupancyPercent}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${isNearFull ? "bg-orange-500" : "bg-primary"}`}
                            style={{ width: `${occupancyPercent}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Новое движение
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Регистрация движения</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitMovement} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Тип операции</Label>
                      <Select
                        value={movementFormData.type}
                        onValueChange={(value) => setMovementFormData({ ...movementFormData, type: value as StockMovement["type"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">Приход</SelectItem>
                          <SelectItem value="out">Расход</SelectItem>
                          <SelectItem value="transfer">Перемещение</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Наименование товара *</Label>
                      <Input
                        value={movementFormData.itemName}
                        onChange={(e) => setMovementFormData({ ...movementFormData, itemName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Количество *</Label>
                      <Input
                        type="number"
                        value={movementFormData.quantity}
                        onChange={(e) => setMovementFormData({ ...movementFormData, quantity: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    {(movementFormData.type === "out" || movementFormData.type === "transfer") && (
                      <div className="space-y-2">
                        <Label>Откуда</Label>
                        <Select
                          value={movementFormData.fromZone}
                          onValueChange={(value) => setMovementFormData({ ...movementFormData, fromZone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите зону" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.map((zone) => (
                              <SelectItem key={zone.id} value={zone.code}>{zone.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {(movementFormData.type === "in" || movementFormData.type === "transfer") && (
                      <div className="space-y-2">
                        <Label>Куда</Label>
                        <Select
                          value={movementFormData.toZone}
                          onValueChange={(value) => setMovementFormData({ ...movementFormData, toZone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите зону" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.map((zone) => (
                              <SelectItem key={zone.id} value={zone.code}>{zone.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Причина/Комментарий</Label>
                      <Input
                        value={movementFormData.reason}
                        onChange={(e) => setMovementFormData({ ...movementFormData, reason: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">Зарегистрировать</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {movements.map((movement) => (
                    <div key={movement.id} className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        movement.type === "in" ? "bg-green-500/10" :
                        movement.type === "out" ? "bg-red-500/10" : "bg-blue-500/10"
                      }`}>
                        {movement.type === "in" ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-500" />
                        ) : movement.type === "out" ? (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        ) : (
                          <Package className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{movement.itemName}</span>
                          <Badge variant="outline">{movement.quantity} шт</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {movement.type === "in" && `→ ${movement.toZone}`}
                          {movement.type === "out" && `${movement.fromZone} →`}
                          {movement.type === "transfer" && `${movement.fromZone} → ${movement.toZone}`}
                          {movement.reason && ` • ${movement.reason}`}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{movement.performedBy}</p>
                        <p>{movement.createdAt.toLocaleDateString("ru-RU")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
