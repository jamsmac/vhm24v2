import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Settings2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  RotateCcw,
  History,
  Coffee,
  Droplets,
  Sparkles,
  Zap,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MixerType = 'coffee' | 'milk' | 'syrup' | 'water' | 'powder' | 'sugar';
type MixerStatus = 'active' | 'maintenance' | 'inactive' | 'warning';

type Mixer = {
  id: number;
  name: string;
  mixerType: MixerType;
  machineId: number;
  machineName: string;
  machineAddress: string;
  status: MixerStatus;
  currentCycles: number;
  maxCycles: number;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  notes: string | null;
  createdAt: string;
};

type MaintenanceLog = {
  id: number;
  mixerId: number;
  mixerName: string;
  maintenanceType: 'cleaning' | 'replacement' | 'repair' | 'inspection';
  performedBy: string;
  cyclesAtMaintenance: number;
  notes: string | null;
  performedAt: string;
};

// Mock data
const mockMixers: Mixer[] = [
  {
    id: 1,
    name: "Кофемолка #1",
    mixerType: "coffee",
    machineId: 1,
    machineName: "Parus F4",
    machineAddress: "ТЦ Парус, 4 этаж",
    status: "active",
    currentCycles: 4500,
    maxCycles: 10000,
    lastMaintenanceDate: "2025-12-15",
    nextMaintenanceDate: "2026-01-15",
    notes: null,
    createdAt: "2025-01-01",
  },
  {
    id: 2,
    name: "Молочный миксер #1",
    mixerType: "milk",
    machineId: 1,
    machineName: "Parus F4",
    machineAddress: "ТЦ Парус, 4 этаж",
    status: "warning",
    currentCycles: 8500,
    maxCycles: 10000,
    lastMaintenanceDate: "2025-11-20",
    nextMaintenanceDate: "2025-12-30",
    notes: "Требуется замена уплотнителя",
    createdAt: "2025-01-01",
  },
  {
    id: 3,
    name: "Сироп-дозатор #1",
    mixerType: "syrup",
    machineId: 1,
    machineName: "Parus F4",
    machineAddress: "ТЦ Парус, 4 этаж",
    status: "active",
    currentCycles: 2100,
    maxCycles: 15000,
    lastMaintenanceDate: "2025-12-01",
    nextMaintenanceDate: "2026-03-01",
    notes: null,
    createdAt: "2025-01-01",
  },
  {
    id: 4,
    name: "Кофемолка #2",
    mixerType: "coffee",
    machineId: 2,
    machineName: "Mega Planet B1",
    machineAddress: "ТЦ Мега Планет, 1 этаж",
    status: "maintenance",
    currentCycles: 9800,
    maxCycles: 10000,
    lastMaintenanceDate: "2025-12-28",
    nextMaintenanceDate: "2026-01-28",
    notes: "На обслуживании - замена жерновов",
    createdAt: "2025-02-15",
  },
  {
    id: 5,
    name: "Молочный миксер #2",
    mixerType: "milk",
    machineId: 2,
    machineName: "Mega Planet B1",
    machineAddress: "ТЦ Мега Планет, 1 этаж",
    status: "active",
    currentCycles: 3200,
    maxCycles: 10000,
    lastMaintenanceDate: "2025-12-10",
    nextMaintenanceDate: "2026-01-10",
    notes: null,
    createdAt: "2025-02-15",
  },
  {
    id: 6,
    name: "Водяной насос #1",
    mixerType: "water",
    machineId: 1,
    machineName: "Parus F4",
    machineAddress: "ТЦ Парус, 4 этаж",
    status: "inactive",
    currentCycles: 15000,
    maxCycles: 20000,
    lastMaintenanceDate: "2025-10-01",
    nextMaintenanceDate: null,
    notes: "Выведен из эксплуатации",
    createdAt: "2025-01-01",
  },
];

const mockMaintenanceLogs: MaintenanceLog[] = [
  {
    id: 1,
    mixerId: 4,
    mixerName: "Кофемолка #2",
    maintenanceType: "replacement",
    performedBy: "Петров В.В.",
    cyclesAtMaintenance: 9800,
    notes: "Замена жерновов",
    performedAt: "2025-12-28 10:30:00",
  },
  {
    id: 2,
    mixerId: 2,
    mixerName: "Молочный миксер #1",
    maintenanceType: "inspection",
    performedBy: "Сидоров К.М.",
    cyclesAtMaintenance: 8200,
    notes: "Обнаружен износ уплотнителя",
    performedAt: "2025-12-25 14:15:00",
  },
  {
    id: 3,
    mixerId: 1,
    mixerName: "Кофемолка #1",
    maintenanceType: "cleaning",
    performedBy: "Петров В.В.",
    cyclesAtMaintenance: 4200,
    notes: "Плановая чистка",
    performedAt: "2025-12-15 09:00:00",
  },
];

const mixerTypeConfig: Record<MixerType, { label: string; icon: React.ReactNode; color: string }> = {
  coffee: { label: "Кофемолка", icon: <Coffee className="h-4 w-4" />, color: "text-amber-400" },
  milk: { label: "Молочный", icon: <Droplets className="h-4 w-4" />, color: "text-blue-400" },
  syrup: { label: "Сироп", icon: <Sparkles className="h-4 w-4" />, color: "text-pink-400" },
  water: { label: "Водяной", icon: <Droplets className="h-4 w-4" />, color: "text-cyan-400" },
  powder: { label: "Порошковый", icon: <Zap className="h-4 w-4" />, color: "text-orange-400" },
  sugar: { label: "Сахарный", icon: <Sparkles className="h-4 w-4" />, color: "text-yellow-400" },
};

const statusConfig: Record<MixerStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: "Активен", color: "text-green-400", bgColor: "bg-green-500/20" },
  warning: { label: "Внимание", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  maintenance: { label: "Обслуживание", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  inactive: { label: "Неактивен", color: "text-gray-400", bgColor: "bg-gray-500/20" },
};

const maintenanceTypeConfig: Record<string, { label: string; color: string }> = {
  cleaning: { label: "Чистка", color: "text-blue-400" },
  replacement: { label: "Замена", color: "text-orange-400" },
  repair: { label: "Ремонт", color: "text-red-400" },
  inspection: { label: "Осмотр", color: "text-green-400" },
};

export default function MixersPage() {
  const [mixers, setMixers] = useState<Mixer[]>(mockMixers);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(mockMaintenanceLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [selectedMixer, setSelectedMixer] = useState<Mixer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    mixerType: "coffee" as MixerType,
    machineId: 1,
    maxCycles: 10000,
    notes: "",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: "cleaning" as 'cleaning' | 'replacement' | 'repair' | 'inspection',
    performedBy: "",
    notes: "",
  });

  // Statistics
  const totalMixers = mixers.length;
  const activeMixers = mixers.filter(m => m.status === 'active').length;
  const warningMixers = mixers.filter(m => m.status === 'warning').length;
  const maintenanceMixers = mixers.filter(m => m.status === 'maintenance').length;

  // Get unique machines for filter
  const machines = Array.from(new Set(mixers.map(m => m.machineName)));

  // Filter mixers
  const filteredMixers = mixers.filter(mixer => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!mixer.name.toLowerCase().includes(query) &&
          !mixer.machineName.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (typeFilter !== "all" && mixer.mixerType !== typeFilter) return false;
    if (statusFilter !== "all" && mixer.status !== statusFilter) return false;
    if (machineFilter !== "all" && mixer.machineName !== machineFilter) return false;
    return true;
  });

  const getCyclePercentage = (current: number, max: number) => {
    return Math.min(100, (current / max) * 100);
  };

  const getCycleColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleAddMixer = () => {
    const newMixer: Mixer = {
      id: mixers.length + 1,
      name: formData.name,
      mixerType: formData.mixerType,
      machineId: formData.machineId,
      machineName: formData.machineId === 1 ? "Parus F4" : "Mega Planet B1",
      machineAddress: formData.machineId === 1 ? "ТЦ Парус, 4 этаж" : "ТЦ Мега Планет, 1 этаж",
      status: "active",
      currentCycles: 0,
      maxCycles: formData.maxCycles,
      lastMaintenanceDate: null,
      nextMaintenanceDate: null,
      notes: formData.notes || null,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setMixers([...mixers, newMixer]);
    setIsAddDialogOpen(false);
    setFormData({ name: "", mixerType: "coffee", machineId: 1, maxCycles: 10000, notes: "" });
    toast.success("Миксер добавлен");
  };

  const handlePerformMaintenance = () => {
    if (!selectedMixer) return;

    const newLog: MaintenanceLog = {
      id: maintenanceLogs.length + 1,
      mixerId: selectedMixer.id,
      mixerName: selectedMixer.name,
      maintenanceType: maintenanceForm.maintenanceType,
      performedBy: maintenanceForm.performedBy,
      cyclesAtMaintenance: selectedMixer.currentCycles,
      notes: maintenanceForm.notes || null,
      performedAt: new Date().toISOString(),
    };

    setMaintenanceLogs([newLog, ...maintenanceLogs]);

    // Update mixer
    setMixers(mixers.map(m => {
      if (m.id === selectedMixer.id) {
        return {
          ...m,
          currentCycles: maintenanceForm.maintenanceType === 'replacement' ? 0 : m.currentCycles,
          status: 'active' as MixerStatus,
          lastMaintenanceDate: new Date().toISOString().split('T')[0],
          nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
      }
      return m;
    }));

    setIsMaintenanceDialogOpen(false);
    setSelectedMixer(null);
    setMaintenanceForm({ maintenanceType: "cleaning", performedBy: "", notes: "" });
    toast.success("Обслуживание выполнено");
  };

  const handleResetCycles = (mixer: Mixer) => {
    setMixers(mixers.map(m => {
      if (m.id === mixer.id) {
        return { ...m, currentCycles: 0, status: 'active' as MixerStatus };
      }
      return m;
    }));
    toast.success("Счётчик циклов сброшен");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  return (
    <AdminLayout title="Миксеры">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Settings2 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Всего миксеров</p>
                  <p className="text-2xl font-bold text-blue-400">{totalMixers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Активных</p>
                  <p className="text-2xl font-bold text-green-400">{activeMixers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Требуют внимания</p>
                  <p className="text-2xl font-bold text-yellow-400">{warningMixers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Wrench className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">На обслуживании</p>
                  <p className="text-2xl font-bold text-purple-400">{maintenanceMixers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по названию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {Object.entries(mixerTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={machineFilter} onValueChange={setMachineFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Автомат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все автоматы</SelectItem>
                  {machines.map((machine) => (
                    <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => setIsHistoryDialogOpen(true)}>
                <History className="h-4 w-4 mr-2" />
                История
              </Button>

              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mixers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Миксеры ({filteredMixers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Автомат</TableHead>
                    <TableHead>Циклы</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Обслуживание</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMixers.map((mixer) => {
                    const typeConfig = mixerTypeConfig[mixer.mixerType];
                    const status = statusConfig[mixer.status];
                    const cyclePercentage = getCyclePercentage(mixer.currentCycles, mixer.maxCycles);
                    
                    return (
                      <TableRow key={mixer.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={typeConfig.color}>{typeConfig.icon}</span>
                            <div>
                              <p className="font-medium">{mixer.name}</p>
                              {mixer.notes && (
                                <p className="text-xs text-muted-foreground">{mixer.notes}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{mixer.machineName}</p>
                            <p className="text-xs text-muted-foreground">{mixer.machineAddress}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{mixer.currentCycles.toLocaleString()}</span>
                              <span className="text-muted-foreground">/ {mixer.maxCycles.toLocaleString()}</span>
                            </div>
                            <Progress 
                              value={cyclePercentage} 
                              className={cn("h-2", getCycleColor(cyclePercentage))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {cyclePercentage.toFixed(0)}%
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-normal", status.bgColor, status.color)}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>Последнее: {formatDate(mixer.lastMaintenanceDate)}</p>
                            <p className="text-muted-foreground">
                              Следующее: {formatDate(mixer.nextMaintenanceDate)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMixer(mixer);
                                setIsMaintenanceDialogOpen(true);
                              }}
                              title="Обслуживание"
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetCycles(mixer)}
                              title="Сбросить циклы"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Редактировать"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Mixer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить миксер</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Название</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Кофемолка #3"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Тип миксера</label>
              <Select
                value={formData.mixerType}
                onValueChange={(v) => setFormData({ ...formData, mixerType: v as MixerType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(mixerTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Автомат</label>
              <Select
                value={formData.machineId.toString()}
                onValueChange={(v) => setFormData({ ...formData, machineId: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Parus F4</SelectItem>
                  <SelectItem value="2">Mega Planet B1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Макс. циклов до обслуживания</label>
              <Input
                type="number"
                value={formData.maxCycles}
                onChange={(e) => setFormData({ ...formData, maxCycles: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Примечания</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddMixer} disabled={!formData.name}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выполнить обслуживание</DialogTitle>
          </DialogHeader>
          
          {selectedMixer && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedMixer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMixer.machineName} • {selectedMixer.currentCycles.toLocaleString()} циклов
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Тип обслуживания</label>
                <Select
                  value={maintenanceForm.maintenanceType}
                  onValueChange={(v) => setMaintenanceForm({ ...maintenanceForm, maintenanceType: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(maintenanceTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className={config.color}>{config.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Выполнил</label>
                <Input
                  value={maintenanceForm.performedBy}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performedBy: e.target.value })}
                  placeholder="ФИО сотрудника"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Примечания</label>
                <Input
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  placeholder="Что было сделано..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handlePerformMaintenance} disabled={!maintenanceForm.performedBy}>
              <Wrench className="h-4 w-4 mr-2" />
              Выполнить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>История обслуживания</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Миксер</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Выполнил</TableHead>
                  <TableHead>Примечания</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceLogs.map((log) => {
                  const typeConfig = maintenanceTypeConfig[log.maintenanceType];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.performedAt).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.mixerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.cyclesAtMaintenance.toLocaleString()} циклов
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.performedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
