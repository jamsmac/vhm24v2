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
import { 
  Plus, 
  Search, 
  Settings2,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Coffee,
  Droplets,
  Sparkles,
  Zap,
  Pencil,
  Trash2,
  MapPin,
  Loader2,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

type MixerType = 'main' | 'secondary' | 'whisk' | 'grinder';
type MixerStatus = 'operational' | 'needs_cleaning' | 'needs_repair' | 'replaced';

const mixerTypeConfig: Record<MixerType, { label: string; icon: React.ReactNode; color: string }> = {
  main: { label: "Основной", icon: <Coffee className="h-4 w-4" />, color: "text-amber-400" },
  secondary: { label: "Вторичный", icon: <Droplets className="h-4 w-4" />, color: "text-blue-400" },
  whisk: { label: "Венчик", icon: <Sparkles className="h-4 w-4" />, color: "text-pink-400" },
  grinder: { label: "Кофемолка", icon: <Zap className="h-4 w-4" />, color: "text-orange-400" },
};

const statusConfig: Record<MixerStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  operational: { label: "Работает", color: "text-green-400", bgColor: "bg-green-500/20", icon: <CheckCircle className="h-4 w-4" /> },
  needs_cleaning: { label: "Требует чистки", color: "text-yellow-400", bgColor: "bg-yellow-500/20", icon: <AlertTriangle className="h-4 w-4" /> },
  needs_repair: { label: "Требует ремонта", color: "text-red-400", bgColor: "bg-red-500/20", icon: <Wrench className="h-4 w-4" /> },
  replaced: { label: "Заменён", color: "text-gray-400", bgColor: "bg-gray-500/20", icon: <Settings2 className="h-4 w-4" /> },
};

export default function MixersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMixerId, setSelectedMixerId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<MixerStatus>("operational");

  const [formData, setFormData] = useState({
    machineId: 0,
    mixerNumber: 1,
    mixerType: "main" as MixerType,
    status: "operational" as MixerStatus,
    totalCycles: 0,
    maxCyclesBeforeMaintenance: 10000,
    notes: "",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    employeeId: 1,
  });

  // Fetch data from API
  const { data: mixers = [], isLoading, refetch } = trpc.admin.mixers.list.useQuery();
  const { data: machines = [] } = trpc.admin.machines.list.useQuery();

  // Mutations
  const createMutation = trpc.admin.mixers.create.useMutation({
    onSuccess: () => {
      toast.success("Миксер добавлен");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const updateMutation = trpc.admin.mixers.update.useMutation({
    onSuccess: () => {
      toast.success("Миксер обновлён");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.mixers.delete.useMutation({
    onSuccess: () => {
      toast.success("Миксер удалён");
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.admin.mixers.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Статус обновлён");
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const maintenanceMutation = trpc.admin.mixers.recordMaintenance.useMutation({
    onSuccess: () => {
      toast.success("Обслуживание записано");
      refetch();
      setIsMaintenanceDialogOpen(false);
      setSelectedMixerId(null);
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.admin.mixers.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Удалено ${data.count} миксеров`);
      setSelectedIds(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const bulkUpdateStatusMutation = trpc.admin.mixers.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Обновлено ${data.count} миксеров`);
      setSelectedIds(new Set());
      setIsBulkStatusDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      machineId: machines[0]?.id || 0,
      mixerNumber: 1,
      mixerType: "main",
      status: "operational",
      totalCycles: 0,
      maxCyclesBeforeMaintenance: 10000,
      notes: "",
    });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (mixer: typeof mixers[0]) => {
    setEditingId(mixer.id);
    setFormData({
      machineId: mixer.machineId,
      mixerNumber: mixer.mixerNumber,
      mixerType: mixer.mixerType as MixerType,
      status: mixer.status as MixerStatus,
      totalCycles: mixer.totalCycles,
      maxCyclesBeforeMaintenance: mixer.maxCyclesBeforeMaintenance,
      notes: mixer.notes || "",
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
    if (confirm("Удалить миксер?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleStatusChange = (id: number, status: MixerStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleMaintenance = () => {
    if (!selectedMixerId) return;
    maintenanceMutation.mutate({
      id: selectedMixerId,
      employeeId: maintenanceForm.employeeId,
    });
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
    if (selectedIds.size === filteredMixers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMixers.map(m => m.id)));
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate({ ids: Array.from(selectedIds) });
    setShowDeleteConfirm(false);
  };

  const handleBulkStatusUpdate = () => {
    bulkUpdateStatusMutation.mutate({
      ids: Array.from(selectedIds),
      status: bulkStatus,
    });
  };

  // Statistics
  const totalMixers = mixers.length;
  const operationalMixers = mixers.filter(m => m.status === 'operational').length;
  const needsAttentionMixers = mixers.filter(m => m.status === 'needs_cleaning' || m.status === 'needs_repair').length;

  // Filter mixers
  const filteredMixers = mixers.filter(mixer => {
    // Search filter (search in machine name and mixer type)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const machine = machines.find(m => m.id === mixer.machineId);
      const matchesMachine = machine?.name.toLowerCase().includes(query);
      const matchesType = mixerTypeConfig[mixer.mixerType as MixerType]?.label.toLowerCase().includes(query);
      if (!matchesMachine && !matchesType) {
        return false;
      }
    }
    
    // Type filter
    if (typeFilter !== "all" && mixer.mixerType !== typeFilter) return false;
    
    // Status filter
    if (statusFilter !== "all" && mixer.status !== statusFilter) return false;
    
    // Machine filter
    if (machineFilter !== "all" && mixer.machineId !== parseInt(machineFilter)) return false;
    
    return true;
  });

  // Group by machine
  const mixersByMachine = filteredMixers.reduce((acc, mixer) => {
    const machine = machines.find(m => m.id === mixer.machineId);
    if (!acc[mixer.machineId]) {
      acc[mixer.machineId] = {
        machineName: machine?.name || `Автомат #${mixer.machineId}`,
        machineAddress: machine?.address || "",
        mixers: [],
      };
    }
    acc[mixer.machineId].mixers.push(mixer);
    return acc;
  }, {} as Record<number, { machineName: string; machineAddress: string; mixers: typeof mixers }>);

  const getCyclePercentage = (current: number, max: number) => {
    return Math.min(100, (current / max) * 100);
  };

  const getCycleColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isBulkProcessing = bulkDeleteMutation.isPending || bulkUpdateStatusMutation.isPending;
  const hasSelection = selectedIds.size > 0;
  const allSelected = filteredMixers.length > 0 && selectedIds.size === filteredMixers.length;
  const selectedMixer = mixers.find(m => m.id === selectedMixerId);

  return (
    <AdminLayout title="Миксеры" description="Управление миксерами и обслуживанием">
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
                  onClick={() => setIsBulkStatusDialogOpen(true)}
                  disabled={isBulkProcessing}
                  className="gap-1"
                >
                  <Settings2 className="h-4 w-4" />
                  Изменить статус
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
                <Settings2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Всего миксеров</p>
                <p className="text-lg font-bold text-blue-400">{totalMixers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Работают</p>
                <p className="text-lg font-bold text-green-400">{operationalMixers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Требуют внимания</p>
                <p className="text-lg font-bold text-amber-400">{needsAttentionMixers}</p>
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
                <p className="text-lg font-bold text-purple-400">{machines.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Select All Checkbox */}
            {filteredMixers.length > 0 && (
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

            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={machineFilter} onValueChange={setMachineFilter}>
              <SelectTrigger className="w-[180px]">
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
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {Object.entries(mixerTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex-1" />
            
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить миксер
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
      ) : Object.keys(mixersByMachine).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет миксеров</p>
            <p className="text-sm text-muted-foreground mt-1">Добавьте первый миксер</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(mixersByMachine).map(([machineId, { machineName, machineAddress, mixers: machineMixers }]) => (
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
                    {machineMixers.length} миксеров
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {machineMixers.map((mixer) => {
                    const typeConfig = mixerTypeConfig[mixer.mixerType as MixerType] || mixerTypeConfig.main;
                    const status = statusConfig[mixer.status as MixerStatus] || statusConfig.operational;
                    const cyclePercentage = getCyclePercentage(mixer.totalCycles, mixer.maxCyclesBeforeMaintenance);
                    const isSelected = selectedIds.has(mixer.id);
                    
                    return (
                      <div
                        key={mixer.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          status.bgColor,
                          isSelected && "ring-2 ring-primary"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(mixer.id)}
                            />
                            <span className={typeConfig.color}>{typeConfig.icon}</span>
                            <div>
                              <p className="font-medium">{typeConfig.label} #{mixer.mixerNumber}</p>
                              <p className="text-xs text-muted-foreground">{mixer.mixerType}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("gap-1", status.color)}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Циклы</span>
                            <span className="font-medium">
                              {mixer.totalCycles.toLocaleString()} / {mixer.maxCyclesBeforeMaintenance.toLocaleString()}
                            </span>
                          </div>
                          
                          <Progress 
                            value={cyclePercentage} 
                            className={cn("h-2", getCycleColor(cyclePercentage))}
                          />
                          
                          {mixer.lastMaintenanceDate && (
                            <p className="text-xs text-muted-foreground">
                              Последнее ТО: {new Date(mixer.lastMaintenanceDate).toLocaleDateString('ru-RU')}
                            </p>
                          )}
                          
                          {mixer.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {mixer.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Select
                            value={mixer.status}
                            onValueChange={(value) => handleStatusChange(mixer.id, value as MixerStatus)}
                          >
                            <SelectTrigger className="flex-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => {
                              setSelectedMixerId(mixer.id);
                              setIsMaintenanceDialogOpen(true);
                            }}
                          >
                            <Wrench className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(mixer)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(mixer.id)}
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
              {editingId ? "Редактировать миксер" : "Новый миксер"}
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип миксера</Label>
                <Select
                  value={formData.mixerType}
                  onValueChange={(value) => setFormData({ ...formData, mixerType: value as MixerType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(mixerTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Номер миксера</Label>
                <Input
                  type="number"
                  value={formData.mixerNumber}
                  onChange={(e) => setFormData({ ...formData, mixerNumber: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as MixerStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Текущие циклы</Label>
                <Input
                  type="number"
                  value={formData.totalCycles}
                  onChange={(e) => setFormData({ ...formData, totalCycles: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Макс. циклов до ТО</Label>
                <Input
                  type="number"
                  value={formData.maxCyclesBeforeMaintenance}
                  onChange={(e) => setFormData({ ...formData, maxCyclesBeforeMaintenance: parseInt(e.target.value) || 10000 })}
                  min={1}
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

      {/* Maintenance Dialog */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Записать обслуживание</DialogTitle>
          </DialogHeader>
          
          {selectedMixer && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  {mixerTypeConfig[selectedMixer.mixerType as MixerType]?.icon || <Settings2 className="h-4 w-4" />}
                  <span className="font-medium">
                    {mixerTypeConfig[selectedMixer.mixerType as MixerType]?.label || selectedMixer.mixerType} #{selectedMixer.mixerNumber}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {machines.find(m => m.id === selectedMixer.machineId)?.name}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm">Текущие циклы:</span>
                  <span className="font-medium">{selectedMixer.totalCycles.toLocaleString()}</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Обслуживание сбросит счётчик циклов и установит статус "Работает".
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleMaintenance} disabled={maintenanceMutation.isPending}>
              {maintenanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Записать ТО
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={isBulkStatusDialogOpen} onOpenChange={setIsBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Массовое изменение статуса</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Выбрано {selectedIds.size} миксеров для изменения статуса
            </p>
            
            <div className="space-y-2">
              <Label>Новый статус</Label>
              <Select
                value={bulkStatus}
                onValueChange={(value) => setBulkStatus(value as MixerStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkStatusDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleBulkStatusUpdate} disabled={bulkUpdateStatusMutation.isPending}>
              {bulkUpdateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Применить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные миксеры?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить {selectedIds.size} миксеров. Это действие нельзя отменить.
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
