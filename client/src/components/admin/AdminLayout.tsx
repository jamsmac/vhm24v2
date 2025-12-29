/**
 * Admin Layout Component
 * Provides sidebar navigation and main content area for admin pages
 */

import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Coffee, 
  ShoppingCart, 
  Ticket, 
  MapPin, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Target,
  UserCog,
  Cpu,
  Droplets,
  SprayCan,
  Wrench,
  Warehouse,
  Building2,
  ChevronDown,
  FileSpreadsheet,
  ClipboardCheck,
  Package
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Дашборд" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Заказы" },
  { href: "/admin/products", icon: Coffee, label: "Продукты" },
  { href: "/admin/promo", icon: Ticket, label: "Промокоды" },
  { href: "/admin/quests", icon: Target, label: "Задания" },
];

const businessNavItems = [
  { href: "/admin/employees", icon: UserCog, label: "Сотрудники" },
  { href: "/admin/machines", icon: Cpu, label: "Автоматы" },
  { href: "/admin/bunkers", icon: Package, label: "Бункеры" },
  { href: "/admin/ingredients", icon: Droplets, label: "Ингредиенты" },
  { href: "/admin/cleaning", icon: SprayCan, label: "Чистящие" },
  { href: "/admin/spare-parts", icon: Wrench, label: "Запчасти" },
  { href: "/admin/warehouse", icon: Warehouse, label: "Склад" },
  { href: "/admin/contractors", icon: Building2, label: "Контрагенты" },
  { href: "/admin/sales-import", icon: FileSpreadsheet, label: "Импорт продаж" },
  { href: "/admin/inventory-check", icon: ClipboardCheck, label: "Инвентаризация" },
];

const systemNavItems = [
  { href: "/admin/users", icon: Users, label: "Пользователи" },
  { href: "/admin/settings", icon: Settings, label: "Настройки" },
];

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">VendHub</span>
            <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">Admin</span>
          </Link>
          <button 
            className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Main */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href || 
                (item.href !== "/admin" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive 
                      ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Business Management */}
          <div>
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Управление</p>
            <div className="space-y-1">
              {businessNavItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      isActive 
                        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* System */}
          <div>
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Система</p>
            <div className="space-y-1">
              {systemNavItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      isActive 
                        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'admin@vendhub.uz'}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2 text-gray-600 dark:text-gray-400"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
                {description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Перейти на сайт
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
