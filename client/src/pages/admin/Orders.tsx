/**
 * Admin Orders Management Page
 * View and manage all orders
 */

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Search, 
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Coffee,
  CreditCard,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  machineId: number;
  items: any;
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  completedAt?: Date | null;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Ожидает", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  confirmed: { label: "Подтверждён", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  preparing: { label: "Готовится", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Coffee },
  ready: { label: "Готов", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  completed: { label: "Завершён", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300", icon: CheckCircle },
  cancelled: { label: "Отменён", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: "Ожидает", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Оплачен", color: "bg-green-100 text-green-700" },
  failed: { label: "Ошибка", color: "bg-red-100 text-red-700" },
  refunded: { label: "Возврат", color: "bg-gray-100 text-gray-700" },
};

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");

  const { data: orders, refetch } = trpc.admin.orders.list.useQuery({ 
    limit: 100,
    status: statusFilter !== "all" ? statusFilter as OrderStatus : undefined 
  });

  const updateStatusMutation = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Статус заказа обновлён");
      refetch();
      setIsStatusDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleChangeStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (selectedOrder) {
      updateStatusMutation.mutate({
        id: selectedOrder.id,
        status: newStatus,
      });
    }
  };

  // Filter orders
  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' UZS';
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: ru });
  };

  return (
    <AdminLayout title="Заказы" description="Управление заказами">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск по номеру заказа..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер заказа</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Оплата</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.map((order) => {
                const status = statusConfig[order.status as OrderStatus];
                const paymentStatus = paymentStatusConfig[order.paymentStatus as PaymentStatus];
                const StatusIcon = status?.icon || Clock;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {order.orderNumber}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("gap-1", status?.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {status?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={paymentStatus?.color}>
                        {paymentStatus?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewOrder(order as Order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleChangeStatus(order as Order)}
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Заказы не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Заказ {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Статус:</span>
                <Badge className={statusConfig[selectedOrder.status]?.color}>
                  {statusConfig[selectedOrder.status]?.label}
                </Badge>
              </div>

              {/* Payment */}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Оплата:</span>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="capitalize">{selectedOrder.paymentMethod}</span>
                  <Badge className={paymentStatusConfig[selectedOrder.paymentStatus]?.color}>
                    {paymentStatusConfig[selectedOrder.paymentStatus]?.label}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Товары:</h4>
                <div className="space-y-2">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Подитог:</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Скидка:</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg">
                  <span>Итого:</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Закрыть
            </Button>
            <Button 
              onClick={() => {
                setIsDetailDialogOpen(false);
                if (selectedOrder) handleChangeStatus(selectedOrder);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Изменить статус
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить статус заказа</DialogTitle>
            <DialogDescription>
              Заказ {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {updateStatusMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
