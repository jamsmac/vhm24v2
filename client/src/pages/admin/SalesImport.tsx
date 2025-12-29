import { useState, useCallback, useEffect, useRef } from "react";
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
import { 
  Upload, 
  FileSpreadsheet, 
  Search, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ParsedColumn = {
  name: string;
  originalName: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: any[];
  suggestedMapping: string | null;
};

type ParsedData = {
  columns: ParsedColumn[];
  preview: Record<string, any>[];
  totalRows: number;
  fileName: string;
  fileType: 'excel' | 'csv';
  validation: {
    valid: boolean;
    errors: string[];
  };
};

type SalesRecord = {
  id: number;
  orderNumber: string;
  productName: string;
  flavor: string | null;
  paymentType: string;
  paymentStatus: string;
  machineCode: string | null;
  address: string | null;
  price: number;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  operator: string | null;
  refundReason: string | null;
  notes: string | null;
};

type ImportBatch = {
  id: number;
  fileName: string;
  fileType: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  status: string;
  createdAt: string;
};

const FIELD_MAPPINGS = [
  { key: 'orderNumber', label: 'Номер заказа' },
  { key: 'productName', label: 'Товар' },
  { key: 'flavor', label: 'Вкус' },
  { key: 'paymentType', label: 'Тип оплаты' },
  { key: 'paymentStatus', label: 'Статус платежа' },
  { key: 'machineCode', label: 'Код автомата' },
  { key: 'address', label: 'Адрес' },
  { key: 'price', label: 'Цена' },
  { key: 'createdAt', label: 'Дата создания' },
  { key: 'paidAt', label: 'Дата оплаты' },
  { key: 'deliveredAt', label: 'Дата доставки' },
  { key: 'operator', label: 'Оператор' },
  { key: 'refundReason', label: 'Причина возврата' },
  { key: 'notes', label: 'Примечания' },
];

const paymentTypeLabels: Record<string, { label: string; color: string; icon: string }> = {
  "cash": { label: "Наличные", color: "bg-green-500/20 text-green-400", icon: "💵" },
  "qr": { label: "QR", color: "bg-blue-500/20 text-blue-400", icon: "📱" },
  "vip": { label: "VIP", color: "bg-amber-500/20 text-amber-400", icon: "⭐" },
  "card": { label: "Карта", color: "bg-purple-500/20 text-purple-400", icon: "💳" },
};

export default function SalesImportPage() {
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totals, setTotals] = useState({ total: 0, cash: 0, qr: 0, vip: 0, card: 0 });

  // Load data
  useEffect(() => {
    loadSalesData();
    loadImportHistory();
  }, [currentPage, pageSize, paymentFilter, dateFrom, dateTo, searchQuery]);

  const loadSalesData = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (paymentFilter !== 'all') params.append('paymentType', paymentFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/upload/sales?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setSalesRecords(result.data.records);
        setTotalRecords(result.data.total);
        setTotals(result.data.totals);
      }
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadImportHistory = async () => {
    try {
      const response = await fetch('/api/upload/history');
      const result = await response.json();
      
      if (result.success) {
        setImportBatches(result.data);
      }
    } catch (error) {
      console.error('Error loading import history:', error);
    }
  };

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
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error("Неподдерживаемый формат файла. Используйте Excel (.xlsx, .xls) или CSV (.csv)");
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setParsedData(result.data);
        
        // Auto-fill column mapping from suggestions
        const autoMapping: Record<string, string> = {};
        result.data.columns.forEach((col: ParsedColumn) => {
          if (col.suggestedMapping) {
            autoMapping[col.suggestedMapping] = col.name;
          }
        });
        setColumnMapping(autoMapping);
        
        setIsUploadDialogOpen(false);
        setIsMappingDialogOpen(true);
      } else {
        toast.error(result.error || 'Ошибка при парсинге файла');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !parsedData) return;

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('columnMapping', JSON.stringify(columnMapping));

      const response = await fetch('/api/upload/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Импортировано: ${result.data.successfulRecords} из ${result.data.totalRecords} записей`
        );
        setIsMappingDialogOpen(false);
        setParsedData(null);
        setSelectedFile(null);
        setColumnMapping({});
        loadSalesData();
        loadImportHistory();
      } else {
        toast.error(result.error || 'Ошибка при импорте данных');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при импорте');
    } finally {
      setIsImporting(false);
    }
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return '0 сум';
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.-]/g, '')) : price;
    if (isNaN(numPrice)) return '0 сум';
    return new Intl.NumberFormat('ru-RU').format(numPrice) + ' сум';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <AdminLayout title="Импорт продаж">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Общая выручка</p>
                  <p className="text-xl font-bold text-amber-400">{formatPrice(totals.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <span className="text-lg">💵</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Наличные</p>
                  <p className="text-xl font-bold text-green-400">{formatPrice(totals.cash)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <span className="text-lg">📱</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">QR платежи</p>
                  <p className="text-xl font-bold text-blue-400">{formatPrice(totals.qr)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">VIP</p>
                  <p className="text-xl font-bold text-amber-400">{formatPrice(totals.vip)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <span className="text-lg">💳</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Карты</p>
                  <p className="text-xl font-bold text-purple-400">{formatPrice(totals.card)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Загрузка данных
            </CardTitle>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Загрузить файл
            </Button>
          </CardHeader>
          <CardContent>
            {importBatches.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">История импорта:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {importBatches.slice(0, 5).map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{batch.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(batch.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm">
                            <span className="text-green-400">{batch.successfulRecords}</span>
                            {batch.failedRecords > 0 && (
                              <span className="text-red-400 ml-1">/ {batch.failedRecords} ошибок</span>
                            )}
                          </p>
                        </div>
                        {batch.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : batch.status === 'processing' ? (
                          <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Нет загруженных файлов</p>
                <p className="text-sm">Загрузите Excel или CSV файл с данными о продажах</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по товару, номеру заказа..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Тип оплаты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="cash">💵 Наличные</SelectItem>
                  <SelectItem value="qr">📱 QR</SelectItem>
                  <SelectItem value="vip">⭐ VIP</SelectItem>
                  <SelectItem value="card">💳 Карта</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
                placeholder="От"
              />
              
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
                placeholder="До"
              />

              <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 / стр</SelectItem>
                  <SelectItem value="100">100 / стр</SelectItem>
                  <SelectItem value="250">250 / стр</SelectItem>
                  <SelectItem value="500">500 / стр</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Данные о продажах ({totalRecords})</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : salesRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Нет данных о продажах</p>
                <p className="text-sm">Загрузите файл с данными для начала работы</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Товар</TableHead>
                        <TableHead>Тип оплаты</TableHead>
                        <TableHead>Автомат</TableHead>
                        <TableHead className="text-right">Цена</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesRecords.map((record) => {
                        const paymentInfo = paymentTypeLabels[record.paymentType] || 
                          { label: record.paymentType, color: 'bg-gray-500/20 text-gray-400', icon: '💰' };
                        
                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{record.productName}</p>
                                {record.flavor && (
                                  <p className="text-xs text-muted-foreground">{record.flavor}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("font-normal", paymentInfo.color)}>
                                {paymentInfo.icon} {paymentInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-mono text-sm">{record.machineCode || '-'}</p>
                                {record.address && (
                                  <p className="text-xs text-muted-foreground">{record.address}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPrice(record.price)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(record.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-green-400 border-green-400/30">
                                {record.paymentStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Показано {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalRecords)} из {totalRecords}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Загрузка файла</DialogTitle>
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
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p>Анализ файла...</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="mb-2">Перетащите файл сюда или</p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Выберите файл
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <p className="text-xs text-muted-foreground mt-4">
                  Поддерживаемые форматы: Excel (.xlsx, .xls), CSV
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Column Mapping Dialog */}
      <Dialog open={isMappingDialogOpen} onOpenChange={setIsMappingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Настройка маппинга колонок</DialogTitle>
          </DialogHeader>

          {parsedData && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{parsedData.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {parsedData.totalRows} записей • {parsedData.columns.length} колонок
                  </p>
                </div>
                {!parsedData.validation.valid && (
                  <Badge variant="destructive" className="ml-auto">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Предупреждения
                  </Badge>
                )}
              </div>

              {/* Validation Errors */}
              {parsedData.validation.errors.length > 0 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="font-medium text-yellow-400 mb-2">Предупреждения:</p>
                  <ul className="text-sm text-yellow-300 space-y-1">
                    {parsedData.validation.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Column Mapping */}
              <div>
                <p className="font-medium mb-3">Сопоставление колонок:</p>
                <div className="grid grid-cols-2 gap-4">
                  {FIELD_MAPPINGS.map((field) => (
                    <div key={field.key} className="flex items-center gap-2">
                      <span className="text-sm w-32 text-muted-foreground">{field.label}:</span>
                      <Select
                        value={columnMapping[field.key] || 'none'}
                        onValueChange={(value) => {
                          setColumnMapping(prev => ({
                            ...prev,
                            [field.key]: value === 'none' ? '' : value
                          }));
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Выберите колонку" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Не выбрано —</SelectItem>
                          {parsedData.columns.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                              {col.suggestedMapping === field.key && (
                                <span className="text-green-400 ml-2">✓</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Table */}
              <div>
                <p className="font-medium mb-3">Предпросмотр данных:</p>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {parsedData.columns.slice(0, 6).map((col) => (
                          <TableHead key={col.name} className="text-xs">
                            {col.name}
                            <Badge variant="outline" className="ml-1 text-[10px]">
                              {col.type}
                            </Badge>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.preview.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {parsedData.columns.slice(0, 6).map((col) => (
                            <TableCell key={col.name} className="text-xs">
                              {String(row[col.name] || '-').slice(0, 30)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMappingDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Импорт...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Импортировать {parsedData?.totalRows} записей
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
