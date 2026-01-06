import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Plus, 
  RefreshCw,
  AlertTriangle,
  Coffee,
  Droplets,
  Package,
  MapPin,
  Pencil,
  Trash2,
  TrendingDown,
  Loader2,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const categoryIcons: Record<string, React.ReactNode> = {
  coffee: <Coffee className="h-4 w-4 text-amber-400" />,
  milk: <Droplets className="h-4 w-4 text-blue-400" />,
  sugar: <Package className="h-4 w-4 text-white" />,
  syrup: <Droplets className="h-4 w-4 text-purple-400" />,
  powder: <Package className="h-4 w-4 text-orange-400" />,
  water: <Droplets className="h-4 w-4 text-cyan-400" />,
  other: <Package className="h-4 w-4 text-gray-400" />,
};

export default function BunkersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefillDialogOpen, setIsRefillDialogOpen] = useState(false);
  const [isBulkRefillDialogOpen, setIsBulkRefillDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedBunkerId, setSelectedBunkerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMachine, setFilterMachine] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkRefillPercentage, setBulkRefillPercentage] = useState(100);
  
  const [formData, setFormData] = useState({
    machineId: 0,
    ingredientId: null as number | null,
    bunkerNumber: 1,
    capacity: 1000,
    currentLevel: 0,
    lowLevelThreshold: 20,
    notes: "",
  });

  const [refillForm, setRefillForm] = useState({
    amount: "",
    employeeId: 1,
  });

  // Fetch data from API
  const { data: bunkers = [], isLoading, refetch } = trpc.admin.bunkers.list.useQuery();
  const { data: machines = [] } = trpc.admin.machines.list.useQuery();
  const { data: ingredients = [] } = trpc.admin.ingredients.list.useQuery();

  // Mutations
  const createMutation = trpc.admin.bunkers.create.useMutation({
    onSuccess: () => {
      toast.success("Бункер добавлен");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const updateMutation = trpc.admin.bunkers.update.useMutation({
    onSuccess: () => {
      toast.success("Бункер обновлён");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.bunkers.delete.useMutation({
    onSuccess: () => {
      toast.success("Бункер удалён");
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const refillMutation = trpc.admin.bunkers.refill.useMutation({
    onSuccess: () => {
      toast.success("Бункер пополнен");
      refetch();
      setIsRefillDialogOpen(false);
      setSelectedBunkerId(null);
      setRefillForm({ amount: "", employeeId: 1 });
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.admin.bunkers.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Удалено ${data.count} бункеров`);
      setSelectedIds(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const bulkRefillMutation = trpc.admin.bunkers.bulkRefill.useMutation({
    onSuccess: (data) => {
      toast.success(`Пополнено ${data.count} бункеров`);
      setSelectedIds(new Set());
      setIsBulkRefillDialogOpen(false);
      setBulkRefillPercentage(100);
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      machineId: machines[0]?.id || 0,
      ingredientId: null,
      bunkerNumber: 1,
      capacity: 1000,
      currentLevel: 0,
      lowLevelThreshold: 20,
      notes: "",
    });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (bunker: typeof bunkers[0]) => {
    setEditingId(bunker.id);
    setFormData({
      machineId: bunker.machineId,
      ingredientId: bunker.ingredientId,
      bunkerNumber: bunker.bunkerNumber,
      capacity: bunker.capacity,
      currentLevel: bunker.currentLevel,
      lowLevelThreshold: bunker.lowLevelThreshold,
      notes: bunker.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.machineId) {
      toast.error("Выберите автомат");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        notes: formData.notes || undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        notes: formData.notes || undefined,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить бункер?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleRefill = () => {
    if (!selectedBunkerId) return;
    
    const amount = parseFloat(refillForm.amount);
    const selectedBunker = bunkers.find(b => b.id === selectedBunkerId);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Введите корректное количество");
      return;
    }
    
    if (selectedBunker) {
      const newLevel = Math.min(selectedBunker.currentLevel + amount, selectedBunker.capacity);
      refillMutation.mutate({
        id: selectedBunkerId,
        newLevel,
        employeeId: refillForm.employeeId,
      });
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
    if (selectedIds.size === filteredBunkers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBunkers.map(b => b.id)));
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate({ ids: Array.from(selectedIds) });
    setShowDeleteConfirm(false);
  };

  const handleBulkRefill = () => {
    bulkRefillMutation.mutate({
      ids: Array.from(selectedIds),
      fillPercentage: bulkRefillPercentage,
      employeeId: 1,
    });
  };

  // Statistics
  const lowLevelBunkers = bunkers.filter(b => (b.currentLevel / b.capacity) * 100 <= b.lowLevelThreshold);
  const criticalBunkers = bunkers.filter(b => (b.currentLevel / b.capacity) * 100 <= 10);
  const uniqueMachines = new Set(bunkers.map(b => b.machineId)).size;

  const getLevelStatus = (bunker: typeof bunkers[0]) => {
    const percentage = (bunker.currentLevel / bunker.capacity) * 100;
    if (percentage <= 10) return { status: "critical", color: "text-red-500", bgColor: "bg-red-500" };
    if (percentage <= bunker.lowLevelThreshold) return { status: "low", color: "text-amber-500", bgColor: "bg-amber-500" };
    if (percentage <= 50) return { status: "medium", color: "text-yellow-500", bgColor: "bg-yellow-500" };
    return { status: "good", color: "text-green-500", bgColor: "bg-green-500" };
  };

  // Filter bunkers
  const filteredBunkers = bunkers.filter(bunker => {
    // Search filter (search in machine name and ingredient name)
    if (searchQuery) {
      const machine = machines.find(m => m.id === bunker.machineId);
      const ingredient = ingredients.find(i => i.id === bunker.ingredientId);
      const searchLower = searchQuery.toLowerCase();
      const matchesMachine = machine?.name.toLowerCase().includes(searchLower);
      const matchesIngredient = ingredient?.name.toLowerCase().includes(searchLower);
      if (!matchesMachine && !matchesIngredient) return false;
    }
    
    // Machine filter
    if (filterMachine !== "all" && bunker.machineId !== parseInt(filterMachine)) return false;
    
    // Status filter
    const percentage = (bunker.currentLevel / bunker.capacity) * 100;
    if (filterStatus === "low" && percentage > bunker.lowLevelThreshold) return false;
    if (filterStatus === "critical" && percentage > 10) return false;
    
    // Low stock filter
    if (filterLowStock && percentage > bunker.lowLevelThreshold) return false;
    
    return true;
  });

  // Group by machine
  const bunkersByMachine = filteredBunkers.reduce((acc, bunker) => {
    const machine = machines.find(m => m.id === bunker.machineId);
    if (!acc[bunker.machineId]) {
      acc[bunker.machineId] = {
        machineName: machine?.name || `Автомат #${bunker.machineId}`,
        machineAddress: machine?.address || "",
        bunkers: [],
      };
    }
    acc[bunker.machineId].bunkers.push(bunker);
    return acc;
  }, {} as Record<number, { machineName: string; machineAddress: string; bunkers: typeof bunkers }>);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isBulkProcessing = bulkDeleteMutation.isPending || bulkRefillMutation.isPending;
  const hasSelection = selectedIds.size > 0;
  const allSelected = filteredBunkers.length > 0 && selectedIds.size === filteredBunkers.length;
  const selectedBunker = bunkers.find(b => b.id === selectedBunkerId);

  return (
    <AdminLayout title="Бункеры" description="Управление ингредиентами в автоматах">
      {/* Bulk Action Toolbar */}
      {hasSelection && (
        <Card className="border-primary/50 bg-primary/5 mb-6">
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
                  onClick={() => setIsBulkRefillDialogOpen(true)}
                  disabled={isBulkProcessing}
                  className="gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Пополнить все
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Package className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Всего бункеров</p>
                <p className="text-lg font-bold text-blue-400">{bunkers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <MapPin className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Автоматов</p>
                <p className="text-lg font-bold text-purple-400">{uniqueMachines}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingDown className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Низкий уровень</p>
                <p className="text-lg font-bold text-amber-400">{lowLevelBunkers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Критический</p>
                <p className="text-lg font-bold text-red-400">{criticalBunkers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                placeholder="Поиск по автомату или ингредиенту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Machine Filter */}
            <Select value={filterMachine} onValueChange={setFilterMachine}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все автоматы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все автоматы</SelectItem>
                {machines.map(machine => (
                  <SelectItem key={machine.id} value={String(machine.id)}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="low">⚠️ Низкий уровень</SelectItem>
                <SelectItem value="critical">🔴 Критический</SelectItem>
              </SelectContent>
            </Select>

            {/* Low Stock Toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="lowStock"
                checked={filterLowStock}
                onCheckedChange={(checked) => setFilterLowStock(checked as boolean)}
              />
              <Label htmlFor="lowStock" className="text-sm cursor-pointer">
                Только низкий запас
              </Label>
            </div>

            {/* Select All Checkbox */}
            {filteredBunkers.length > 0 && (
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
            
            <div className="flex-1" />
            
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить бункер
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <p className="text-muted-foreground">Загрузка...</p>
          </CardContent>
        </Card>
      ) : Object.keys(bunkersByMachine).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет бункеров</p>
            <p className="text-sm text-muted-foreground mt-1">Добавьте первый бункер</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(bunkersByMachine).map(([machineId, { machineName, machineAddress, bunkers: machineBunkers }]) => (
            <Card key={machineId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{machineName}</CardTitle>
                    {machineAddress && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {machineAddress}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {machineBunkers.length} бункеров
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {machineBunkers.map((bunker) => {
                    const levelStatus = getLevelStatus(bunker);
                    const percentage = Math.round((bunker.currentLevel / bunker.capacity) * 100);
                    const ingredient = ingredients.find(i => i.id === bunker.ingredientId);
                    const isSelected = selectedIds.has(bunker.id);
                    
                    return (
                      <div
                        key={bunker.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          levelStatus.status === "critical" && "border-red-500/50 bg-red-500/5",
                          levelStatus.status === "low" && "border-amber-500/50 bg-amber-500/5",
                          levelStatus.status === "medium" && "border-yellow-500/30 bg-yellow-500/5",
                          levelStatus.status === "good" && "border-green-500/30 bg-green-500/5",
                          isSelected && "ring-2 ring-primary"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(bunker.id)}
                            />
                            {ingredient ? categoryIcons[ingredient.category] || categoryIcons.other : categoryIcons.other}
                            <div>
                              <p className="font-medium">{ingredient?.name || "Не назначен"}</p>
                              <p className="text-xs text-muted-foreground">Бункер #{bunker.bunkerNumber}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {levelStatus.status === "critical" && (
                              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                            )}
                            {levelStatus.status === "low" && (
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Уровень</span>
                            <span className={cn("font-medium", levelStatus.color)}>
                              {bunker.currentLevel} / {bunker.capacity} г
                            </span>
                          </div>
                          
                          <Progress 
                            value={percentage} 
                            className={cn("h-2", levelStatus.bgColor)}
                          />
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{percentage}%</span>
                            <span>Порог: {bunker.lowLevelThreshold}%</span>
                          </div>
                          
                          {bunker.lastRefillDate && (
                            <p className="text-xs text-muted-foreground">
                              Последнее пополнение: {new Date(bunker.lastRefillDate).toLocaleDateString('ru-RU')}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => {
                              setSelectedBunkerId(bunker.id);
                              setIsRefillDialogOpen(true);
                            }}
                          >
                            <RefreshCw className="h-3 w-3" />
                            Пополнить
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(bunker)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(bunker.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) closeDialog();
        else setIsDialogOpen(true);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Редактировать бункер" : "Новый бункер"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Автомат *</Label>
              <Select
                value={formData.machineId ? String(formData.machineId) : ""}
                onValueChange={(value) => setFormData({ ...formData, machineId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите автомат" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map(machine => (
                    <SelectItem key={machine.id} value={String(machine.id)}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Ингредиент</Label>
              <Select
                value={formData.ingredientId ? String(formData.ingredientId) : "none"}
                onValueChange={(value) => setFormData({ ...formData, ingredientId: value === "none" ? null : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ингредиент" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не назначен</SelectItem>
                  {ingredients.map(ingredient => (
                    <SelectItem key={ingredient.id} value={String(ingredient.id)}>
                      {ingredient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Номер бункера</Label>
                <Input
                  type="number"
                  value={formData.bunkerNumber}
                  onChange={(e) => setFormData({ ...formData, bunkerNumber: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Ёмкость (г)</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Текущий уровень (г)</Label>
                <Input
                  type="number"
                  value={formData.currentLevel}
                  onChange={(e) => setFormData({ ...formData, currentLevel: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Порог низкого уровня (%)</Label>
                <Input
                  type="number"
                  value={formData.lowLevelThreshold}
                  onChange={(e) => setFormData({ ...formData, lowLevelThreshold: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={100}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Примечания</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация"
                rows={2}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Сохранить" : "Добавить"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Refill Dialog */}
      <Dialog open={isRefillDialogOpen} onOpenChange={setIsRefillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пополнение бункера</DialogTitle>
          </DialogHeader>
          
          {selectedBunker && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  {ingredients.find(i => i.id === selectedBunker.ingredientId) 
                    ? categoryIcons[ingredients.find(i => i.id === selectedBunker.ingredientId)!.category]
                    : categoryIcons.other}
                  <span className="font-medium">
                    {ingredients.find(i => i.id === selectedBunker.ingredientId)?.name || "Не назначен"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {machines.find(m => m.id === selectedBunker.machineId)?.name} • Бункер #{selectedBunker.bunkerNumber}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm">Текущий уровень:</span>
                  <span className="font-medium">{selectedBunker.currentLevel} / {selectedBunker.capacity} г</span>
                </div>
                <Progress 
                  value={(selectedBunker.currentLevel / selectedBunker.capacity) * 100} 
                  className="h-2 mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Количество для пополнения (г)</Label>
                <Input
                  type="number"
                  value={refillForm.amount}
                  onChange={(e) => setRefillForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={`Макс: ${selectedBunker.capacity - selectedBunker.currentLevel} г`}
                />
                <p className="text-xs text-muted-foreground">
                  Доступно для заполнения: {selectedBunker.capacity - selectedBunker.currentLevel} г
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefillDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleRefill} disabled={refillMutation.isPending}>
              {refillMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Пополнить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Refill Dialog */}
      <Dialog open={isBulkRefillDialogOpen} onOpenChange={setIsBulkRefillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Массовое пополнение бункеров</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Выбрано {selectedIds.size} бункеров для пополнения
            </p>
            
            <div className="space-y-4">
              <Label>Уровень заполнения: {bulkRefillPercentage}%</Label>
              <Slider
                value={[bulkRefillPercentage]}
                onValueChange={([value]) => setBulkRefillPercentage(value)}
                min={10}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkRefillDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleBulkRefill} disabled={bulkRefillMutation.isPending}>
              {bulkRefillMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Пополнить все
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные бункеры?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить {selectedIds.size} бункеров. Это действие нельзя отменить.
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
