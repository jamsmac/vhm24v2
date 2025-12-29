import { useState, useCallback } from "react";
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
import { 
  Upload, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SalesRecord = {
  id: number;
  orderNumber: string;
  operatorNumber: string;
  productName: string;
  flavorName: string;
  orderResource: string;
  orderType: string;
  paymentStatus: string;
  cupType: string;
  machineCode: string;
  address: string;
  orderPrice: number;
  brewingStatus: string;
  createdTime: string;
  paymentTime: string;
  deliveryTime: string;
  refundTime: string | null;
  reason: string | null;
  notes: string | null;
};

type ImportBatch = {
  id: number;
  batchId: string;
  fileName: string;
  fileType: string;
  recordCount: number;
  successCount: number;
  errorCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  createdAt: string;
};

// Mock data
const mockSalesRecords: SalesRecord[] = [
  {
    id: 1,
    orderNumber: "ff000008d82025122500145924a8181f0000",
    operatorNumber: "G9982401B-1",
    productName: "Cocoa",
    flavorName: "Какао без сахара",
    orderResource: "Оплата наличными",
    orderType: "Обычный порядок",
    paymentStatus: "Оплачено",
    cupType: "1",
    machineCode: "24a8181f0000",
    address: "Parus F4",
    orderPrice: 15000,
    brewingStatus: "Доставлен",
    createdTime: "2025-12-24 21:15:02",
    paymentTime: "2025-12-24 21:15:02",
    deliveryTime: "2025-12-24 21:15:56",
    refundTime: null,
    reason: null,
    notes: null,
  },
  {
    id: 2,
    orderNumber: "ff000008d42025122423411624a8181f0000",
    operatorNumber: "G9982401B-1",
    productName: "MacCoffee 3in1",
    flavorName: "MacCoffee с сахаром",
    orderResource: "Оплата наличными",
    orderType: "Обычный порядок",
    paymentStatus: "Оплачено",
    cupType: "1",
    machineCode: "24a8181f0000",
    address: "Parus F4",
    orderPrice: 10000,
    brewingStatus: "Доставлен",
    createdTime: "2025-12-24 20:41:39",
    paymentTime: "2025-12-24 20:41:39",
    deliveryTime: "2025-12-24 20:42:33",
    refundTime: null,
    reason: null,
    notes: null,
  },
  {
    id: 3,
    orderNumber: "ff000008d12025122420505824a8181f0000",
    operatorNumber: "G9982401B-1",
    productName: "Americano",
    flavorName: "Американо с сахаром",
    orderResource: "QR платежи",
    orderType: "Обычный порядок",
    paymentStatus: "Оплачено",
    cupType: "1",
    machineCode: "24a8181f0000",
    address: "Parus F4",
    orderPrice: 20000,
    brewingStatus: "Доставлен",
    createdTime: "2025-12-24 17:51:26",
    paymentTime: "2025-12-24 17:51:26",
    deliveryTime: "2025-12-24 17:52:51",
    refundTime: null,
    reason: null,
    notes: null,
  },
  {
    id: 4,
    orderNumber: "ff000008cf2025122419032224a8181f0000",
    operatorNumber: "G9982401B-1",
    productName: "Cappuccino",
    flavorName: "Капучино с сахаром",
    orderResource: "VIP",
    orderType: "Обычный порядок",
    paymentStatus: "Оплачено",
    cupType: "1",
    machineCode: "24a8181f0000",
    address: "Parus F4",
    orderPrice: 20000,
    brewingStatus: "Доставлен",
    createdTime: "2025-12-24 16:03:24",
    paymentTime: "2025-12-24 16:03:24",
    deliveryTime: "2025-12-24 16:05:06",
    refundTime: null,
    reason: null,
    notes: null,
  },
];

const mockImportBatches: ImportBatch[] = [
  {
    id: 1,
    batchId: "batch_20251225_001",
    fileName: "order_2025-12-25 01_06_38.xlsx",
    fileType: "xlsx",
    recordCount: 395,
    successCount: 390,
    errorCount: 5,
    status: "completed",
    dateRangeStart: "2025-12-01",
    dateRangeEnd: "2025-12-25",
    createdAt: "2025-12-25 01:06:38",
  },
  {
    id: 2,
    batchId: "batch_20251224_001",
    fileName: "order_2025-12-25 01_04_32.xlsx",
    fileType: "xlsx",
    recordCount: 461,
    successCount: 461,
    errorCount: 0,
    status: "completed",
    dateRangeStart: "2025-11-15",
    dateRangeEnd: "2025-12-24",
    createdAt: "2025-12-25 01:04:32",
  },
];

const paymentTypeLabels: Record<string, { label: string; color: string; icon: string }> = {
  "Оплата наличными": { label: "Наличные", color: "bg-green-500/20 text-green-400", icon: "💵" },
  "QR платежи": { label: "QR", color: "bg-blue-500/20 text-blue-400", icon: "📱" },
  "VIP": { label: "VIP", color: "bg-amber-500/20 text-amber-400", icon: "⭐" },
  "Карты": { label: "Карта", color: "bg-purple-500/20 text-purple-400", icon: "💳" },
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-400" />,
  processing: <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4 text-green-400" />,
  failed: <XCircle className="h-4 w-4 text-red-400" />,
};

export default function SalesImportPage() {
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(mockSalesRecords);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>(mockImportBatches);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Calculate statistics
  const totalRevenue = salesRecords.reduce((sum, r) => sum + r.orderPrice, 0);
  const cashRevenue = salesRecords.filter(r => r.orderResource === "Оплата наличными").reduce((sum, r) => sum + r.orderPrice, 0);
  const qrRevenue = salesRecords.filter(r => r.orderResource === "QR платежи").reduce((sum, r) => sum + r.orderPrice, 0);
  const vipRevenue = salesRecords.filter(r => r.orderResource === "VIP").reduce((sum, r) => sum + r.orderPrice, 0);

  // Filter records
  const filteredRecords = salesRecords.filter(record => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!record.orderNumber.toLowerCase().includes(query) &&
          !record.productName.toLowerCase().includes(query) &&
          !record.address.toLowerCase().includes(query) &&
          !record.machineCode.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (paymentFilter !== "all" && record.orderResource !== paymentFilter) {
      return false;
    }
    if (statusFilter !== "all" && record.paymentStatus !== statusFilter) {
      return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf',
    ];
    
    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error("Неподдерживаемый формат файла. Используйте Excel, CSV или PDF.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate processing
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);
      setIsUploadDialogOpen(false);
      
      // Add new batch
      const newBatch: ImportBatch = {
        id: importBatches.length + 1,
        batchId: `batch_${new Date().toISOString().slice(0,10).replace(/-/g, '')}_${String(importBatches.length + 1).padStart(3, '0')}`,
        fileName: file.name,
        fileType: fileExtension.slice(1),
        recordCount: Math.floor(Math.random() * 500) + 50,
        successCount: 0,
        errorCount: 0,
        status: "processing",
        dateRangeStart: null,
        dateRangeEnd: null,
        createdAt: new Date().toISOString(),
      };
      
      setImportBatches(prev => [newBatch, ...prev]);
      toast.success(`Файл "${file.name}" загружен и обрабатывается`);
      
      // Simulate completion after 3 seconds
      setTimeout(() => {
        setImportBatches(prev => prev.map(b => 
          b.id === newBatch.id 
            ? { ...b, status: "completed" as const, successCount: b.recordCount - 2, errorCount: 2 }
            : b
        ));
        toast.success(`Импорт завершен: ${newBatch.recordCount - 2} записей добавлено`);
      }, 3000);
    }, 2500);
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    toast.success(`Экспорт в ${format.toUpperCase()} начат...`);
    // In real implementation, this would trigger a download
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
  };

  return (
    <AdminLayout title="Импорт продаж" subtitle="Загрузка и анализ данных о продажах">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Общая выручка</p>
                <p className="text-lg font-bold text-emerald-400">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <span className="text-xl">💵</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Наличные</p>
                <p className="text-lg font-bold text-green-400">{formatPrice(cashRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <span className="text-xl">📱</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">QR платежи</p>
                <p className="text-lg font-bold text-blue-400">{formatPrice(qrRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <span className="text-xl">⭐</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VIP</p>
                <p className="text-lg font-bold text-amber-400">{formatPrice(vipRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import History */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">История импорта</CardTitle>
          <Button onClick={() => setIsUploadDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Загрузить файл
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {importBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="font-medium text-sm">{batch.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.recordCount} записей • {new Date(batch.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {statusIcons[batch.status]}
                    <span className="text-xs capitalize">
                      {batch.status === 'completed' ? 'Завершено' : 
                       batch.status === 'processing' ? 'Обработка' :
                       batch.status === 'failed' ? 'Ошибка' : 'Ожидание'}
                    </span>
                  </div>
                  {batch.status === 'completed' && (
                    <Badge variant="outline" className="text-xs">
                      {batch.successCount} ✓ / {batch.errorCount} ✗
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedBatch(batch);
                      setIsPreviewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по номеру заказа, товару, адресу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Тип оплаты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="Оплата наличными">💵 Наличные</SelectItem>
                <SelectItem value="QR платежи">📱 QR платежи</SelectItem>
                <SelectItem value="VIP">⭐ VIP</SelectItem>
                <SelectItem value="Карты">💳 Карты</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Дата от"
            />
            
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Дата до"
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Найдено: {filteredRecords.length} записей
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">№</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Оплата</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record, index) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.productName}</p>
                        <p className="text-xs text-muted-foreground">{record.flavorName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{record.address}</p>
                        <p className="text-xs text-muted-foreground font-mono">{record.machineCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", paymentTypeLabels[record.orderResource]?.color || "bg-gray-500/20")}>
                        {paymentTypeLabels[record.orderResource]?.icon} {paymentTypeLabels[record.orderResource]?.label || record.orderResource}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(record.orderPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                        {record.brewingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(record.createdTime).toLocaleString('ru-RU')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Показывать:</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredRecords.length)} из {filteredRecords.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Загрузка файла с данными</DialogTitle>
          </DialogHeader>
          
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              isUploading && "pointer-events-none opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Загрузка... {uploadProgress}%</p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Перетащите файл сюда или
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.xlsx,.xls,.csv,.pdf';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileUpload(file);
                    };
                    input.click();
                  }}
                >
                  Выберите файл
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Поддерживаемые форматы: Excel (.xlsx, .xls), CSV, PDF
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали импорта</DialogTitle>
          </DialogHeader>
          
          {selectedBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Файл</p>
                  <p className="font-medium">{selectedBatch.fileName}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Статус</p>
                  <div className="flex items-center gap-2">
                    {statusIcons[selectedBatch.status]}
                    <span className="font-medium capitalize">
                      {selectedBatch.status === 'completed' ? 'Завершено' : 
                       selectedBatch.status === 'processing' ? 'Обработка' :
                       selectedBatch.status === 'failed' ? 'Ошибка' : 'Ожидание'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Всего записей</p>
                  <p className="font-medium">{selectedBatch.recordCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Успешно / Ошибки</p>
                  <p className="font-medium">
                    <span className="text-green-400">{selectedBatch.successCount}</span>
                    {" / "}
                    <span className="text-red-400">{selectedBatch.errorCount}</span>
                  </p>
                </div>
              </div>
              
              {selectedBatch.errorCount > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <p className="text-sm font-medium text-red-400">Ошибки при импорте</p>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Строка 45: Неверный формат даты</li>
                    <li>• Строка 128: Отсутствует обязательное поле "Цена заказа"</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
