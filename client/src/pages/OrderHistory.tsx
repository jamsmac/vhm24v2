/**
 * VendHub TWA - Order History Page
 * "Warm Brew" Design System
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelegram } from "@/contexts/TelegramContext";
import { ArrowLeft, Coffee, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Mock orders
const mockOrders = [
  {
    id: "1",
    status: "completed" as const,
    items: [
      { name: "Капучино", quantity: 2, price: 20000 },
      { name: "Американо", quantity: 1, price: 15000 },
    ],
    totalAmount: 55000,
    discountAmount: 5500,
    finalAmount: 49500,
    pointsEarned: 495,
    machineName: "KIUT Корпус А",
    machineNumber: "M-001",
    createdAt: "2024-12-26T10:30:00",
  },
  {
    id: "2",
    status: "completed" as const,
    items: [
      { name: "Латте", quantity: 1, price: 22000 },
    ],
    totalAmount: 22000,
    discountAmount: 0,
    finalAmount: 22000,
    pointsEarned: 220,
    machineName: "IT Park",
    machineNumber: "M-002",
    createdAt: "2024-12-25T14:15:00",
  },
  {
    id: "3",
    status: "cancelled" as const,
    items: [
      { name: "Эспрессо", quantity: 3, price: 12000 },
    ],
    totalAmount: 36000,
    discountAmount: 0,
    finalAmount: 36000,
    pointsEarned: 0,
    machineName: "Hilton",
    machineNumber: "M-003",
    createdAt: "2024-12-24T09:00:00",
  },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusConfig = {
  pending: { icon: Clock, label: 'Ожидание', color: 'text-amber-600 bg-amber-100' },
  paid: { icon: CheckCircle, label: 'Оплачен', color: 'text-blue-600 bg-blue-100' },
  preparing: { icon: Coffee, label: 'Готовится', color: 'text-purple-600 bg-purple-100' },
  ready: { icon: Package, label: 'Готов', color: 'text-green-600 bg-green-100' },
  completed: { icon: CheckCircle, label: 'Завершён', color: 'text-green-600 bg-green-100' },
  cancelled: { icon: XCircle, label: 'Отменён', color: 'text-red-600 bg-red-100' },
};

export default function OrderHistory() {
  const { haptic } = useTelegram();

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-display text-xl font-bold">История заказов</h1>
      </header>

      <main className="px-4 py-4 space-y-3">
        {mockOrders.length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">У вас пока нет заказов</p>
          </div>
        ) : (
          mockOrders.map((order, index) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="coffee-card">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{order.machineName}</p>
                      <p className="text-sm text-muted-foreground">{order.machineNumber}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </div>
                  </div>
                  
                  {/* Items */}
                  <div className="space-y-1 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)} UZS</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Footer */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatPrice(order.finalAmount)} UZS</p>
                      {order.pointsEarned > 0 && (
                        <p className="text-xs text-green-600">+{order.pointsEarned} бонусов</p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </main>

      <div className="h-8" />
    </div>
  );
}
