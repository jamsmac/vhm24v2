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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Coffee,
  Wrench,
  Sparkles,
  Eye,
  Play,
  Pause,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InventoryCheck = {
  id: number;
  checkNumber: string;
  checkType: "full" | "partial" | "spot";
  status: "draft" | "in_progress" | "completed" | "approved";
  startedAt: string | null;
  completedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  conductedBy: string;
  notes: string | null;
  itemsCount: number;
  discrepancyCount: number;
  totalDiscrepancyValue: number;
};

type InventoryCheckItem = {
  id: number;
  checkId: number;
  itemType: "ingredient" | "cleaning" | "spare_part";
  itemId: number;
  itemName: string;
  unit: string;
  expectedQuantity: number;
  actualQuantity: number | null;
  discrepancy: number | null;
  discrepancyReason: string | null;
  countedBy: string | null;
  countedAt: string | null;
};

// Mock data
const mockInventoryChecks: InventoryCheck[] = [
  {
    id: 1,
    checkNumber: "INV-2025-001",
    checkType: "full",
    status: "completed",
    startedAt: "2025-12-20 09:00:00",
    completedAt: "2025-12-20 17:30:00",
    approvedAt: "2025-12-21 10:00:00",
    approvedBy: "Иванов А.А.",
    conductedBy: "Петров В.В.",
    notes: "Плановая полная инвентаризация склада",
    itemsCount: 45,
    discrepancyCount: 3,
    totalDiscrepancyValue: -125000,
  },
  {
    id: 2,
    checkNumber: "INV-2025-002",
    checkType: "spot",
    status: "in_progress",
    startedAt: "2025-12-28 14:00:00",
    completedAt: null,
    approvedAt: null,
    approvedBy: null,
    conductedBy: "Сидоров К.М.",
    notes: "Выборочная проверка кофейных ингредиентов",
    itemsCount: 12,
    discrepancyCount: 1,
    totalDiscrepancyValue: -15000,
  },
  {
    id: 3,
    checkNumber: "INV-2025-003",
    checkType: "partial",
    status: "draft",
    startedAt: null,
    completedAt: null,
    approvedAt: null,
    approvedBy: null,
    conductedBy: "Козлов Д.И.",
    notes: "Проверка запасных частей",
    itemsCount: 0,
    discrepancyCount: 0,
    totalDiscrepancyValue: 0,
  },
];

const mockCheckItems: InventoryCheckItem[] = [
  { id: 1, checkId: 2, itemType: "ingredient", itemId: 1, itemName: "Арабика 100%", unit: "кг", expectedQuantity: 15, actualQuantity: 14.5, discrepancy: -0.5, discrepancyReason: "Потери при фасовке", countedBy: "Сидоров К.М.", countedAt: "2025-12-28 14:15:00" },
  { id: 2, checkId: 2, itemType: "ingredient", itemId: 2, itemName: "Робуста", unit: "кг", expectedQuantity: 8, actualQuantity: 8, discrepancy: 0, discrepancyReason: null, countedBy: "Сидоров К.М.", countedAt: "2025-12-28 14:20:00" },
  { id: 3, checkId: 2, itemType: "ingredient", itemId: 3, itemName: "Молоко 3.2%", unit: "л", expectedQuantity: 25, actualQuantity: null, discrepancy: null, discrepancyReason: null, countedBy: null, countedAt: null },
  { id: 4, checkId: 2, itemType: "ingredient", itemId: 4, itemName: "Сливки 10%", unit: "л", expectedQuantity: 5, actualQuantity: null, discrepancy: null, discrepancyReason: null, countedBy: null, countedAt: null },
  { id: 5, checkId: 2, itemType: "ingredient", itemId: 5, itemName: "Сахар белый", unit: "кг", expectedQuantity: 20, actualQuantity: null, discrepancy: null, discrepancyReason: null, countedBy: null, countedAt: null },
];

const checkTypeLabels: Record<string, { label: string; color: string }> = {
  full: { label: "Полная", color: "bg-blue-500/20 text-blue-400" },
  partial: { label: "Частичная", color: "bg-amber-500/20 text-amber-400" },
  spot: { label: "Выборочная", color: "bg-purple-500/20 text-purple-400" },
};

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Черновик", color: "bg-gray-500/20 text-gray-400", icon: <FileText className="h-4 w-4" /> },
  in_progress: { label: "В процессе", color: "bg-blue-500/20 text-blue-400", icon: <Clock className="h-4 w-4" /> },
  completed: { label: "Завершена", color: "bg-green-500/20 text-green-400", icon: <CheckCircle className="h-4 w-4" /> },
  approved: { label: "Утверждена", color: "bg-emerald-500/20 text-emerald-400", icon: <Check className="h-4 w-4" /> },
};

const itemTypeIcons: Record<string, React.ReactNode> = {
  ingredient: <Coffee className="h-4 w-4 text-amber-400" />,
  cleaning: <Sparkles className="h-4 w-4 text-blue-400" />,
  spare_part: <Wrench className="h-4 w-4 text-gray-400" />,
};

export default function InventoryCheckPage() {
  const [inventoryChecks, setInventoryChecks] = useState<InventoryCheck[]>(mockInventoryChecks);
  const [checkItems, setCheckItems] = useState<InventoryCheckItem[]>(mockCheckItems);
  const [selectedCheck, setSelectedCheck] = useState<InventoryCheck | null>(null);
  const [isNewCheckDialogOpen, setIsNewCheckDialogOpen] = useState(false);
  const [isCountDialogOpen, setIsCountDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryCheckItem | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Form state
  const [newCheckForm, setNewCheckForm] = useState({
    checkType: "full" as "full" | "partial" | "spot",
    conductedBy: "",
    notes: "",
  });
  
  const [countForm, setCountForm] = useState({
    actualQuantity: "",
    discrepancyReason: "",
  });

  // Statistics
  const totalChecks = inventoryChecks.length;
  const inProgressChecks = inventoryChecks.filter(c => c.status === "in_progress").length;
  const totalDiscrepancies = inventoryChecks.reduce((sum, c) => sum + c.discrepancyCount, 0);
  const totalDiscrepancyValue = inventoryChecks.reduce((sum, c) => sum + c.totalDiscrepancyValue, 0);

  const handleCreateCheck = () => {
    const newCheck: InventoryCheck = {
      id: inventoryChecks.length + 1,
      checkNumber: `INV-2025-${String(inventoryChecks.length + 1).padStart(3, '0')}`,
      checkType: newCheckForm.checkType,
      status: "draft",
      startedAt: null,
      completedAt: null,
      approvedAt: null,
      approvedBy: null,
      conductedBy: newCheckForm.conductedBy,
      notes: newCheckForm.notes,
      itemsCount: 0,
      discrepancyCount: 0,
      totalDiscrepancyValue: 0,
    };
    
    setInventoryChecks(prev => [newCheck, ...prev]);
    setIsNewCheckDialogOpen(false);
    setNewCheckForm({ checkType: "full", conductedBy: "", notes: "" });
    toast.success(`Инвентаризация ${newCheck.checkNumber} создана`);
  };

  const handleStartCheck = (check: InventoryCheck) => {
    setInventoryChecks(prev => prev.map(c => 
      c.id === check.id 
        ? { ...c, status: "in_progress" as const, startedAt: new Date().toISOString() }
        : c
    ));
    toast.success(`Инвентаризация ${check.checkNumber} начата`);
  };

  const handleCompleteCheck = (check: InventoryCheck) => {
    setInventoryChecks(prev => prev.map(c => 
      c.id === check.id 
        ? { ...c, status: "completed" as const, completedAt: new Date().toISOString() }
        : c
    ));
    toast.success(`Инвентаризация ${check.checkNumber} завершена`);
  };

  const handleApproveCheck = (check: InventoryCheck) => {
    setInventoryChecks(prev => prev.map(c => 
      c.id === check.id 
        ? { ...c, status: "approved" as const, approvedAt: new Date().toISOString(), approvedBy: "Текущий пользователь" }
        : c
    ));
    toast.success(`Инвентаризация ${check.checkNumber} утверждена`);
  };

  const handleCountItem = () => {
    if (!selectedItem) return;
    
    const actualQty = parseFloat(countForm.actualQuantity);
    if (isNaN(actualQty)) {
      toast.error("Введите корректное количество");
      return;
    }
    
    const discrepancy = actualQty - selectedItem.expectedQuantity;
    
    setCheckItems(prev => prev.map(item => 
      item.id === selectedItem.id
        ? {
            ...item,
            actualQuantity: actualQty,
            discrepancy,
            discrepancyReason: discrepancy !== 0 ? countForm.discrepancyReason : null,
            countedBy: "Текущий пользователь",
            countedAt: new Date().toISOString(),
          }
        : item
    ));
    
    setIsCountDialogOpen(false);
    setSelectedItem(null);
    setCountForm({ actualQuantity: "", discrepancyReason: "" });
    toast.success("Количество записано");
  };

  const formatPrice = (price: number) => {
    const sign = price >= 0 ? "+" : "";
    return sign + new Intl.NumberFormat('ru-RU').format(price) + ' сум';
  };

  const filteredChecks = activeTab === "all" 
    ? inventoryChecks 
    : inventoryChecks.filter(c => c.status === activeTab);

  return (
    <AdminLayout title="Инвентаризация" subtitle="Учет и сверка остатков">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <ClipboardCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Всего проверок</p>
                <p className="text-lg font-bold text-blue-400">{totalChecks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">В процессе</p>
                <p className="text-lg font-bold text-amber-400">{inProgressChecks}</p>
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
                <p className="text-xs text-muted-foreground">Расхождения</p>
                <p className="text-lg font-bold text-red-400">{totalDiscrepancies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "bg-gradient-to-br border",
          totalDiscrepancyValue >= 0 
            ? "from-green-500/10 to-green-600/5 border-green-500/20"
            : "from-red-500/10 to-red-600/5 border-red-500/20"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                totalDiscrepancyValue >= 0 ? "bg-green-500/20" : "bg-red-500/20"
              )}>
                {totalDiscrepancyValue >= 0 
                  ? <TrendingUp className="h-5 w-5 text-green-400" />
                  : <TrendingDown className="h-5 w-5 text-red-400" />
                }
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Сумма расхождений</p>
                <p className={cn(
                  "text-lg font-bold",
                  totalDiscrepancyValue >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {formatPrice(totalDiscrepancyValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="draft">Черновики</TabsTrigger>
            <TabsTrigger value="in_progress">В процессе</TabsTrigger>
            <TabsTrigger value="completed">Завершены</TabsTrigger>
            <TabsTrigger value="approved">Утверждены</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button onClick={() => setIsNewCheckDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Новая инвентаризация
        </Button>
      </div>

      {/* Inventory Checks List */}
      <div className="grid gap-4">
        {filteredChecks.map((check) => (
          <Card key={check.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-lg",
                    statusLabels[check.status].color
                  )}>
                    {statusLabels[check.status].icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{check.checkNumber}</h3>
                      <Badge className={checkTypeLabels[check.checkType].color}>
                        {checkTypeLabels[check.checkType].label}
                      </Badge>
                      <Badge className={statusLabels[check.status].color}>
                        {statusLabels[check.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ответственный: {check.conductedBy}
                    </p>
                    {check.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{check.notes}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>📦 {check.itemsCount} позиций</span>
                      {check.discrepancyCount > 0 && (
                        <span className="text-red-400">⚠️ {check.discrepancyCount} расхождений</span>
                      )}
                      {check.startedAt && (
                        <span>Начало: {new Date(check.startedAt).toLocaleDateString('ru-RU')}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {check.status === "draft" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStartCheck(check)}
                      className="gap-1"
                    >
                      <Play className="h-4 w-4" />
                      Начать
                    </Button>
                  )}
                  {check.status === "in_progress" && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCheck(check)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Подсчет
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCompleteCheck(check)}
                        className="gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Завершить
                      </Button>
                    </>
                  )}
                  {check.status === "completed" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleApproveCheck(check)}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Утвердить
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedCheck(check)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Check Dialog */}
      <Dialog open={isNewCheckDialogOpen} onOpenChange={setIsNewCheckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая инвентаризация</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Тип проверки</Label>
              <Select 
                value={newCheckForm.checkType} 
                onValueChange={(v) => setNewCheckForm(prev => ({ ...prev, checkType: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Полная инвентаризация</SelectItem>
                  <SelectItem value="partial">Частичная проверка</SelectItem>
                  <SelectItem value="spot">Выборочная проверка</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Ответственный</Label>
              <Input
                value={newCheckForm.conductedBy}
                onChange={(e) => setNewCheckForm(prev => ({ ...prev, conductedBy: e.target.value }))}
                placeholder="ФИО сотрудника"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Примечания</Label>
              <Textarea
                value={newCheckForm.notes}
                onChange={(e) => setNewCheckForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Описание или причина проверки"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCheckDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateCheck}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check Details Dialog */}
      <Dialog open={!!selectedCheck} onOpenChange={() => setSelectedCheck(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCheck?.checkNumber} - Подсчет позиций
            </DialogTitle>
          </DialogHeader>
          
          {selectedCheck && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground">Тип</p>
                  <Badge className={checkTypeLabels[selectedCheck.checkType].color}>
                    {checkTypeLabels[selectedCheck.checkType].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Статус</p>
                  <Badge className={statusLabels[selectedCheck.status].color}>
                    {statusLabels[selectedCheck.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ответственный</p>
                  <p className="font-medium">{selectedCheck.conductedBy}</p>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тип</TableHead>
                    <TableHead>Наименование</TableHead>
                    <TableHead className="text-right">Ожидаемое</TableHead>
                    <TableHead className="text-right">Фактическое</TableHead>
                    <TableHead className="text-right">Расхождение</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkItems.filter(i => i.checkId === selectedCheck.id).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{itemTypeIcons[item.itemType]}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          {item.countedAt && (
                            <p className="text-xs text-muted-foreground">
                              Подсчитано: {new Date(item.countedAt).toLocaleString('ru-RU')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.expectedQuantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.actualQuantity !== null ? (
                          <span>{item.actualQuantity} {item.unit}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.discrepancy !== null ? (
                          <span className={cn(
                            "font-medium",
                            item.discrepancy > 0 ? "text-green-400" : 
                            item.discrepancy < 0 ? "text-red-400" : "text-muted-foreground"
                          )}>
                            {item.discrepancy > 0 ? "+" : ""}{item.discrepancy} {item.unit}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {selectedCheck.status === "in_progress" && item.actualQuantity === null && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsCountDialogOpen(true);
                            }}
                          >
                            Подсчитать
                          </Button>
                        )}
                        {item.actualQuantity !== null && (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Count Item Dialog */}
      <Dialog open={isCountDialogOpen} onOpenChange={setIsCountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подсчет: {selectedItem?.itemName}</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Ожидаемое количество</p>
                <p className="text-2xl font-bold">{selectedItem.expectedQuantity} {selectedItem.unit}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Фактическое количество</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={countForm.actualQuantity}
                  onChange={(e) => setCountForm(prev => ({ ...prev, actualQuantity: e.target.value }))}
                  placeholder={`Введите количество в ${selectedItem.unit}`}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Причина расхождения (если есть)</Label>
                <Textarea
                  value={countForm.discrepancyReason}
                  onChange={(e) => setCountForm(prev => ({ ...prev, discrepancyReason: e.target.value }))}
                  placeholder="Укажите причину, если количество отличается"
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCountDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCountItem}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
