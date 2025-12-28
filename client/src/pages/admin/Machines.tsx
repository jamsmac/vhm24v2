/**
 * Admin Machines Management Page
 * Monitor and manage vending machines with inventory tracking
 */

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin,
  Wifi,
  WifiOff,
  Wrench,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Coffee,
  History,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type MachineStatus = 'online' | 'offline' | 'maintenance';

interface Machine {
  id: number;
  machineCode: string;
  name: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  status: MachineStatus;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface InventoryItem {
  id: number;
  machineId: number;
  productId: number;
  productName?: string;
  currentStock: number;
  maxCapacity: number;
  lowStockThreshold: number;
  lastRestocked: Date | null;
}

interface MaintenanceLog {
  id: number;
  machineId: number;
  type: string;
  description: string | null;
  performedBy: string | null;
  cost: number | null;
  createdAt: Date;
}

interface MachineFormData {
  machineCode: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  status: MachineStatus;
  imageUrl: string;
}

const statusConfig: Record<MachineStatus, { label: string; color: string; icon: typeof Wifi }> = {
  online: { label: "Онлайн", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Wifi },
  offline: { label: "Офлайн", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: WifiOff },
  maintenance: { label: "Обслуживание", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Wrench },
};

const maintenanceTypes = [
  { value: "routine", label: "Плановое ТО" },
  { value: "repair", label: "Ремонт" },
  { value: "restock", label: "Пополнение" },
  { value: "cleaning", label: "Чистка" },
  { value: "other", label: "Другое" },
];

const defaultFormData: MachineFormData = {
  machineCode: "",
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  status: "online",
  imageUrl: "",
};

export default function AdminMachines() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState<MachineFormData>(defaultFormData);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: "routine",
    description: "",
    performedBy: "",
    cost: 0,
  });

  const { data: machines, refetch } = trpc.admin.machines.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: inventory, refetch: refetchInventory } = trpc.admin.machines.getInventory.useQuery(
    { machineId: selectedMachine?.id ?? 0 },
    { enabled: !!selectedMachine }
  );
  const { data: maintenanceLogs, refetch: refetchLogs } = trpc.admin.machines.getMaintenanceLogs.useQuery(
    { machineId: selectedMachine?.id ?? 0 },
    { enabled: !!selectedMachine }
  );

  // Mutations
  const createMutation = trpc.admin.machines.create.useMutation({
    onSuccess: () => {
      toast.success("Автомат добавлен");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const updateMutation = trpc.admin.machines.update.useMutation({
    onSuccess: () => {
      toast.success("Автомат обновлён");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteMutation = trpc.admin.machines.delete.useMutation({
    onSuccess: () => {
      toast.success("Автомат удалён");
      refetch();
      setIsDeleteDialogOpen(false);
      setDeletingMachine(null);
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const updateInventoryMutation = trpc.admin.machines.updateInventory.useMutation({
    onSuccess: () => {
      toast.success("Запасы обновлены");
      refetchInventory();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const addMaintenanceMutation = trpc.admin.machines.addMaintenanceLog.useMutation({
    onSuccess: () => {
      toast.success("Запись добавлена");
      refetchLogs();
      setIsMaintenanceDialogOpen(false);
      setMaintenanceForm({ type: "routine", description: "", performedBy: "", cost: 0 });
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingMachine(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      machineCode: machine.machineCode,
      name: machine.name,
      address: machine.address || "",
      latitude: machine.latitude || "",
      longitude: machine.longitude || "",
      status: machine.status,
      imageUrl: machine.imageUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (machine: Machine) => {
    setDeletingMachine(machine);
    setIsDeleteDialogOpen(true);
  };

  const handleViewInventory = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsInventoryDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.machineCode || !formData.name) {
      toast.error("Заполните обязательные поля");
      return;
    }

    const submitData = {
      machineCode: formData.machineCode,
      name: formData.name,
      address: formData.address || undefined,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,
      status: formData.status,
      imageUrl: formData.imageUrl || undefined,
    };

    if (editingMachine) {
      updateMutation.mutate({ id: editingMachine.id, ...submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const confirmDelete = () => {
    if (deletingMachine) {
      deleteMutation.mutate({ id: deletingMachine.id });
    }
  };

  const handleRestockItem = (item: InventoryItem) => {
    updateInventoryMutation.mutate({
      machineId: item.machineId,
      productId: item.productId,
      currentStock: item.maxCapacity,
    });
  };

  const handleAddMaintenance = () => {
    if (!selectedMachine) return;
    addMaintenanceMutation.mutate({
      machineId: selectedMachine.id,
      type: maintenanceForm.type as any,
      description: maintenanceForm.description || undefined,
      performedBy: maintenanceForm.performedBy || undefined,
      cost: maintenanceForm.cost || undefined,
    });
  };

  // Filter machines
  const filteredMachines = machines?.filter((machine) => {
    const matchesSearch = 
      machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.machineCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || machine.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: ru });
  };

  const getStockLevel = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage <= 10) return { color: "bg-red-500", label: "Критический" };
    if (percentage <= 30) return { color: "bg-yellow-500", label: "Низкий" };
    return { color: "bg-green-500", label: "Норма" };
  };

  // Calculate stats
  const stats = {
    total: machines?.length || 0,
    online: machines?.filter(m => m.status === "online").length || 0,
    offline: machines?.filter(m => m.status === "offline").length || 0,
    maintenance: machines?.filter(m => m.status === "maintenance").length || 0,
  };

  return (
    <AdminLayout title="Автоматы" description="Управление вендинговыми автоматами">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Всего</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Онлайн</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
              <Wifi className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Офлайн</p>
                <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
              </div>
              <WifiOff className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">На ТО</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
              </div>
              <Wrench className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск по названию или коду..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Добавить автомат
        </Button>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMachines?.map((machine) => {
          const status = statusConfig[machine.status as MachineStatus];
          const StatusIcon = status?.icon || Wifi;
          
          return (
            <Card key={machine.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{machine.name}</CardTitle>
                    <p className="text-sm text-gray-500 font-mono">{machine.machineCode}</p>
                  </div>
                  <Badge className={cn("gap-1", status?.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {status?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {machine.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{machine.address}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewInventory(machine as Machine)}
                    className="flex-1"
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Запасы
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(machine as Machine)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(machine as Machine)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {filteredMachines?.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Автоматы не найдены
          </div>
        )}
      </div>

      {/* Create/Edit Machine Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMachine ? "Редактировать автомат" : "Добавить автомат"}
            </DialogTitle>
            <DialogDescription>
              {editingMachine ? "Измените данные автомата" : "Добавьте новый вендинговый автомат"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="machineCode">Код автомата *</Label>
                <Input
                  id="machineCode"
                  value={formData.machineCode}
                  onChange={(e) => setFormData({ ...formData, machineCode: e.target.value.toUpperCase() })}
                  placeholder="M-001"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value as MachineStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="KIUT Корпус А"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="ул. Примерная, 123"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Широта</Label>
                <Input
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="41.311081"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Долгота</Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="69.240562"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL изображения</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
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
            <DialogTitle>Удалить автомат?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить автомат "{deletingMachine?.name}" ({deletingMachine?.machineCode})? 
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

      {/* Inventory & Maintenance Dialog */}
      <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {selectedMachine?.name}
              <Badge className={cn("ml-2", statusConfig[selectedMachine?.status as MachineStatus]?.color)}>
                {statusConfig[selectedMachine?.status as MachineStatus]?.label}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Код: {selectedMachine?.machineCode}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="inventory" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inventory">
                <Package className="w-4 h-4 mr-2" />
                Запасы
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                <History className="w-4 h-4 mr-2" />
                История ТО
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="mt-4">
              {inventory && inventory.length > 0 ? (
                <div className="space-y-3">
                  {inventory.map((item) => {
                    const stockLevel = getStockLevel(item.currentStock, item.maxCapacity);
                    const percentage = (item.currentStock / item.maxCapacity) * 100;
                    const isLow = item.currentStock <= item.lowStockThreshold;
                    
                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Coffee className="w-4 h-4 text-amber-600" />
                            <span className="font-medium">{item.productName || `Продукт #${item.productId}`}</span>
                            {isLow && (
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRestockItem(item as InventoryItem)}
                            disabled={updateInventoryMutation.isPending}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Пополнить
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              {item.currentStock} / {item.maxCapacity}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              isLow ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                            )}>
                              {stockLevel.label}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                        {item.lastRestocked && (
                          <p className="text-xs text-gray-400 mt-1">
                            Последнее пополнение: {formatDate(item.lastRestocked)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Нет данных о запасах</p>
                  <p className="text-sm">Добавьте продукты в инвентарь автомата</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button 
                  size="sm" 
                  onClick={() => setIsMaintenanceDialogOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить запись
                </Button>
              </div>
              
              {maintenanceLogs && maintenanceLogs.length > 0 ? (
                <div className="space-y-3">
                  {maintenanceLogs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {maintenanceTypes.find(t => t.value === log.type)?.label || log.type}
                          </Badge>
                          {log.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{log.description}</p>
                          )}
                          {log.performedBy && (
                            <p className="text-xs text-gray-400 mt-1">Выполнил: {log.performedBy}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                          {(log.cost ?? 0) > 0 && (
                            <p className="text-sm font-medium">{(log.cost ?? 0).toLocaleString()} UZS</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Нет записей о техобслуживании</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance Log Dialog */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить запись ТО</DialogTitle>
            <DialogDescription>
              Автомат: {selectedMachine?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Тип обслуживания</Label>
              <Select 
                value={maintenanceForm.type} 
                onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Input
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                placeholder="Описание работ..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Выполнил</Label>
                <Input
                  value={maintenanceForm.performedBy}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performedBy: e.target.value })}
                  placeholder="Имя техника"
                />
              </div>
              <div className="space-y-2">
                <Label>Стоимость (UZS)</Label>
                <Input
                  type="number"
                  value={maintenanceForm.cost}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleAddMaintenance}
              disabled={addMaintenanceMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {addMaintenanceMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
