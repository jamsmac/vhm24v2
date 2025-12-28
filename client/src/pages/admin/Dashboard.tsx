/**
 * Admin Dashboard Page
 * Overview of key metrics and recent activity
 */

import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Coffee,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, change, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm mt-1",
                trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"
              )}>
                {trend === "up" ? <TrendingUp className="w-4 h-4" /> : 
                 trend === "down" ? <TrendingDown className="w-4 h-4" /> : null}
                <span>{change > 0 ? "+" : ""}{change}% за неделю</span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OrderStatusBadgeProps {
  status: string;
}

function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending: { 
      label: "Ожидает", 
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: <Clock className="w-3 h-3" />
    },
    confirmed: { 
      label: "Подтверждён", 
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      icon: <CheckCircle className="w-3 h-3" />
    },
    preparing: { 
      label: "Готовится", 
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      icon: <Coffee className="w-3 h-3" />
    },
    ready: { 
      label: "Готов", 
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      icon: <CheckCircle className="w-3 h-3" />
    },
    completed: { 
      label: "Завершён", 
      className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      icon: <CheckCircle className="w-3 h-3" />
    },
    cancelled: { 
      label: "Отменён", 
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      icon: <XCircle className="w-3 h-3" />
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
      config.className
    )}>
      {config.icon}
      {config.label}
    </span>
  );
}

export default function AdminDashboard() {
  const { data: products } = trpc.products.list.useQuery();
  const { data: machines } = trpc.machines.list.useQuery();

  // Mock data for demo (in production, these would come from API)
  const stats = {
    totalRevenue: 2450000,
    totalOrders: 156,
    activeUsers: 89,
    totalProducts: products?.length || 0,
  };

  const recentOrders = [
    { id: "VH-ABC123", customer: "Jamshid M.", total: 42000, status: "preparing", time: "5 мин назад" },
    { id: "VH-DEF456", customer: "Alisher K.", total: 20000, status: "ready", time: "12 мин назад" },
    { id: "VH-GHI789", customer: "Nodira S.", total: 35000, status: "completed", time: "25 мин назад" },
    { id: "VH-JKL012", customer: "Rustam T.", total: 15000, status: "pending", time: "30 мин назад" },
    { id: "VH-MNO345", customer: "Dilnoza A.", total: 28000, status: "cancelled", time: "45 мин назад" },
  ];

  const topProducts = [
    { name: "Капучино", orders: 45, revenue: 900000 },
    { name: "Латте", orders: 38, revenue: 836000 },
    { name: "Американо", orders: 32, revenue: 480000 },
    { name: "Эспрессо", orders: 28, revenue: 336000 },
    { name: "Чай зелёный", orders: 22, revenue: 220000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' UZS';
  };

  return (
    <AdminLayout title="Дашборд" description="Обзор ключевых показателей">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Выручка за месяц" 
          value={formatCurrency(stats.totalRevenue)}
          change={12.5}
          trend="up"
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard 
          title="Заказов за месяц" 
          value={stats.totalOrders}
          change={8.2}
          trend="up"
          icon={<ShoppingCart className="w-6 h-6" />}
        />
        <StatCard 
          title="Активных пользователей" 
          value={stats.activeUsers}
          change={-2.1}
          trend="down"
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard 
          title="Продуктов в каталоге" 
          value={stats.totalProducts}
          icon={<Coffee className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              Последние заказы
              <a href="/admin/orders" className="text-sm font-normal text-amber-600 hover:underline">
                Все заказы →
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-sm">
                      {order.customer[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{order.customer}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.id} • {order.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(order.total)}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              Топ продуктов
              <a href="/admin/products" className="text-sm font-normal text-amber-600 hover:underline">
                Все продукты →
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      index === 0 ? "bg-amber-400 text-amber-900" :
                      index === 1 ? "bg-gray-300 text-gray-700" :
                      index === 2 ? "bg-orange-300 text-orange-800" :
                      "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.orders} заказов</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machine Status */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            Статус автоматов
            <a href="/admin/machines" className="text-sm font-normal text-amber-600 hover:underline">
              Все автоматы →
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {machines?.map((machine) => (
              <div key={machine.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{machine.name}</span>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    machine.status === "online" ? "bg-green-500" :
                    machine.status === "offline" ? "bg-red-500" :
                    "bg-yellow-500"
                  )} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{machine.machineCode}</p>
                <p className={cn(
                  "text-xs mt-1 font-medium",
                  machine.status === "online" ? "text-green-600" :
                  machine.status === "offline" ? "text-red-600" :
                  "text-yellow-600"
                )}>
                  {machine.status === "online" ? "Онлайн" :
                   machine.status === "offline" ? "Офлайн" :
                   "Обслуживание"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
