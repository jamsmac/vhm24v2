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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  RefreshCw,
  AlertTriangle,
  Coffee,
  Droplets,
  Package,
  MapPin,
  History,
  TrendingDown,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Bunker = {
  id: number;
  machineId: number;
  machineName: string;
  machineAddress: string;
  ingredientId: number;
  ingredientName: string;
  ingredientCategory: string;
  bunkerNumber: number;
  capacity: number;
  currentLevel: number;
  lowLevelThreshold: number;
  lastRefillDate: string | null;
  lastRefillBy: string | null;
  estimatedEmptyDate: string | null;
  dailyConsumption: number;
};

type RefillHistory = {
  id: number;
  bunkerId: number;
  previousLevel: number;
  newLevel: number;
  refillAmount: number;
  refilledBy: string;
  refilledAt: string;
  notes: string | null;
};

// Mock data
const mockBunkers: Bunker[] = [
  {
    id: 1,
    machineId: 1,
    machineName: "Parus F4",
    machineAddress: "ТЦ Парус, 4 этаж",
    ingredientId: 1,
    ingredientName: "Арабика 100%",
    ingredientCategory: "coffee",
    bunkerNumber: 1,
    capacity: 2000,
    currentLevel: 450,
    lowLevelThreshold: 20,
    lastRefillDate: "2025-12-27 14:30:00",
    lastRefillBy: "Петров В.В.",
    estimatedEmptyDate: "2025-12-30",
    dailyConsumption: 150,
  },
  {
    id: 2,
    machineId: 1,
    machineName: "Parus F4",
    machineAddress: "ТЦ Парус, 4 этаж",
    ingredientId: 2,
    ingredientName: "Робуста",
    ingredientCategory: "coffee",
    bunkerNumber: 2,
    capacity: 1500,
    currentLevel: 1200,
    lowLevelThreshold: 20,
    lastRefillDate: "2025-12-25 10:00:00",
    lastRefillBy: "Сидоров К.М.",
    estimatedEmptyDate: "2026-01-05",
    dailyConsumption: 80,
  },
  {
    id: 3,
    machineId: 1,
    machineName: "Parus F4",
    machineAddress: "ТЦ Парус, 4 этаж",
    ingredientId: 3,
    ingredientName: "Молоко 3.2%",
    ingredientCategory: "milk",
    bunkerNumber: 3,
    capacity: 5000,
    currentLevel: 800,
    lowLevelThreshold: 25,
    lastRefillDate: "2025-12-28 08:00:00",
    lastRefillBy: "Козлов Д.И.",
    estimatedEmptyDate: "2025-12-29",
    dailyConsumption: 400,
  },
  {
    id: 4,
    machineId: 2,
    machineName: "Mega Planet B1",
    machineAddress: "ТЦ Мега Планет, 1 этаж",
    ingredientId: 1,
    ingredientName: "Арабика 100%",
    ingredientCategory: "coffee",
    bunkerNumber: 1,
    capacity: 2000,
    currentLevel: 1800,
    lowLevelThreshold: 20,
    lastRefillDate: "2025-12-28 16:00:00",
    lastRefillBy: "Петров В.В.",
    estimatedEmptyDate: "2026-01-10",
    dailyConsumption: 120,
  },
  {
    id: 5,
    machineId: 2,
    machineName: "Mega Planet B1",
    machineAddress: "ТЦ Мега Планет, 1 этаж",
    ingredientId: 5,
    ingredientName: "Сахар белый",
    ingredientCategory: "sugar",
    bunkerNumber: 4,
    capacity: 3000,
    currentLevel: 150,
    lowLevelThreshold: 15,
    lastRefillDate: "2025-12-20 12:00:00",
    lastRefillBy: "Сидоров К.М.",
    estimatedEmptyDate: "2025-12-29",
    dailyConsumption: 50,
  },
];

const mockRefillHistory: RefillHistory[] = [
  { id: 1, bunkerId: 1, previousLevel: 200, newLevel: 1800, refillAmount: 1600, refilledBy: "Петров В.В.", refilledAt: "2025-12-27 14:30:00", notes: null },
  { id: 2, bunkerId: 3, previousLevel: 500, newLevel: 4500, refillAmount: 4000, refilledBy: "Козлов Д.И.", refilledAt: "2025-12-28 08:00:00", notes: "Новая партия молока" },
  { id: 3, bunkerId: 4, previousLevel: 300, newLevel: 1800, refillAmount: 1500, refilledBy: "Петров В.В.", refilledAt: "2025-12-28 16:00:00", notes: null },
];

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
  const [bunkers, setBunkers] = useState<Bunker[]>(mockBunkers);
  const [refillHistory, setRefillHistory] = useState<RefillHistory[]>(mockRefillHistory);
  const [selectedBunker, setSelectedBunker] = useState<Bunker | null>(null);
  const [isRefillDialogOpen, setIsRefillDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [filterMachine, setFilterMachine] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Refill form
  const [refillForm, setRefillForm] = useState({
    amount: "",
    notes: "",
  });

  // Statistics
  const lowLevelBunkers = bunkers.filter(b => (b.currentLevel / b.capacity) * 100 <= b.lowLevelThreshold);
  const criticalBunkers = bunkers.filter(b => (b.currentLevel / b.capacity) * 100 <= 10);
  const uniqueMachines = Array.from(new Set(bunkers.map(b => b.machineId))).length;

  const getLevelStatus = (bunker: Bunker) => {
    const percentage = (bunker.currentLevel / bunker.capacity) * 100;
    if (percentage <= 10) return { status: "critical", color: "text-red-500", bgColor: "bg-red-500" };
    if (percentage <= bunker.lowLevelThreshold) return { status: "low", color: "text-amber-500", bgColor: "bg-amber-500" };
    if (percentage <= 50) return { status: "medium", color: "text-yellow-500", bgColor: "bg-yellow-500" };
    return { status: "good", color: "text-green-500", bgColor: "bg-green-500" };
  };

  const handleRefill = () => {
    if (!selectedBunker) return;
    
    const amount = parseFloat(refillForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Введите корректное количество");
      return;
    }
    
    const newLevel = Math.min(selectedBunker.currentLevel + amount, selectedBunker.capacity);
    
    // Update bunker
    setBunkers(prev => prev.map(b => 
      b.id === selectedBunker.id
        ? { 
            ...b, 
            currentLevel: newLevel,
            lastRefillDate: new Date().toISOString(),
            lastRefillBy: "Текущий пользователь",
          }
        : b
    ));
    
    // Add to history
    const newHistoryEntry: RefillHistory = {
      id: refillHistory.length + 1,
      bunkerId: selectedBunker.id,
      previousLevel: selectedBunker.currentLevel,
      newLevel,
      refillAmount: amount,
      refilledBy: "Текущий пользователь",
      refilledAt: new Date().toISOString(),
      notes: refillForm.notes || null,
    };
    setRefillHistory(prev => [newHistoryEntry, ...prev]);
    
    setIsRefillDialogOpen(false);
    setSelectedBunker(null);
    setRefillForm({ amount: "", notes: "" });
    toast.success(`Бункер пополнен на ${amount} г`);
  };

  // Filter bunkers
  const filteredBunkers = bunkers.filter(bunker => {
    if (filterMachine !== "all" && bunker.machineId !== parseInt(filterMachine)) return false;
    if (filterStatus === "low") {
      const percentage = (bunker.currentLevel / bunker.capacity) * 100;
      return percentage <= bunker.lowLevelThreshold;
    }
    if (filterStatus === "critical") {
      const percentage = (bunker.currentLevel / bunker.capacity) * 100;
      return percentage <= 10;
    }
    return true;
  });

  // Group by machine
  const bunkersByMachine = filteredBunkers.reduce((acc, bunker) => {
    if (!acc[bunker.machineId]) {
      acc[bunker.machineId] = {
        machineName: bunker.machineName,
        machineAddress: bunker.machineAddress,
        bunkers: [],
      };
    }
    acc[bunker.machineId].bunkers.push(bunker);
    return acc;
  }, {} as Record<number, { machineName: string; machineAddress: string; bunkers: Bunker[] }>);

  return (
    <AdminLayout title="Бункеры" description="Управление ингредиентами в автоматах">
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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={filterMachine} onValueChange={setFilterMachine}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все автоматы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все автоматы</SelectItem>
                {Array.from(new Set(bunkers.map(b => b.machineId))).map(machineId => {
                  const machine = bunkers.find(b => b.machineId === machineId);
                  return (
                    <SelectItem key={machineId} value={String(machineId)}>
                      {machine?.machineName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
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
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsHistoryDialogOpen(true)}
              className="ml-auto gap-2"
            >
              <History className="h-4 w-4" />
              История пополнений
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bunkers by Machine */}
      <div className="space-y-6">
        {Object.entries(bunkersByMachine).map(([machineId, { machineName, machineAddress, bunkers: machineBunkers }]) => (
          <Card key={machineId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{machineName}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {machineAddress}
                  </p>
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
                  
                  return (
                    <div
                      key={bunker.id}
                      className={cn(
                        "p-4 rounded-lg border transition-colors",
                        levelStatus.status === "critical" && "border-red-500/50 bg-red-500/5",
                        levelStatus.status === "low" && "border-amber-500/50 bg-amber-500/5",
                        levelStatus.status === "medium" && "border-yellow-500/30 bg-yellow-500/5",
                        levelStatus.status === "good" && "border-green-500/30 bg-green-500/5",
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {categoryIcons[bunker.ingredientCategory]}
                          <div>
                            <p className="font-medium">{bunker.ingredientName}</p>
                            <p className="text-xs text-muted-foreground">Бункер #{bunker.bunkerNumber}</p>
                          </div>
                        </div>
                        {levelStatus.status === "critical" && (
                          <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                        )}
                        {levelStatus.status === "low" && (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        )}
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
                          {bunker.estimatedEmptyDate && (
                            <span>≈ {new Date(bunker.estimatedEmptyDate).toLocaleDateString('ru-RU')}</span>
                          )}
                        </div>
                        
                        {bunker.lastRefillDate && (
                          <p className="text-xs text-muted-foreground">
                            Последнее пополнение: {new Date(bunker.lastRefillDate).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 gap-2"
                        onClick={() => {
                          setSelectedBunker(bunker);
                          setIsRefillDialogOpen(true);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Пополнить
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                  {categoryIcons[selectedBunker.ingredientCategory]}
                  <span className="font-medium">{selectedBunker.ingredientName}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedBunker.machineName} • Бункер #{selectedBunker.bunkerNumber}
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
              
              <div className="space-y-2">
                <Label>Примечания (опционально)</Label>
                <Input
                  value={refillForm.notes}
                  onChange={(e) => setRefillForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Номер партии, поставщик и т.д."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefillDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleRefill}>
              Пополнить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>История пополнений</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {refillHistory.map((entry) => {
              const bunker = bunkers.find(b => b.id === entry.bunkerId);
              return (
                <div key={entry.id} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {bunker?.ingredientName} • {bunker?.machineName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.previousLevel}г → {entry.newLevel}г (+{entry.refillAmount}г)
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{entry.refilledBy}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.refilledAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
