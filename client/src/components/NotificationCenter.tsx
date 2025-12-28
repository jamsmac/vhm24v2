/**
 * VendHub TWA - Notification Center Component
 * Dropdown panel showing all notifications with actions
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useNotificationsStore,
  formatRelativeTime,
  getNotificationTypeLabel,
  getNotificationTypeColor,
  type Notification,
} from "@/stores/notificationsStore";
import { useTelegram } from "@/contexts/TelegramContext";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ChevronRight,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [, navigate] = useLocation();
  const { haptic } = useTelegram();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationsStore();

  const handleNotificationClick = (notification: Notification) => {
    haptic.impact('light');
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    haptic.notification('success');
    markAllAsRead();
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    haptic.impact('light');
    removeNotification(id);
  };

  const handleClearAll = () => {
    haptic.notification('warning');
    clearAll();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-14 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <Card className="overflow-hidden shadow-2xl border-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-espresso to-espresso/90">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white">Уведомления</h3>
                    <p className="text-xs text-white/70">
                      {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитано'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/profile/notifications">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        haptic.selection();
                        onClose();
                      }}
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={onClose}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Actions bar */}
              {notifications.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Прочитать все
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleClearAll}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Очистить
                  </Button>
                </div>
              )}

              {/* Notifications list */}
              <ScrollArea className="max-h-[60vh]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <BellOff className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-center">
                      Нет уведомлений
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Здесь будут появляться акции и обновления
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors relative ${
                          !notification.read ? 'bg-caramel/5' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-caramel" />
                        )}

                        <div className="flex gap-3 pl-2">
                          <div className="flex-1 min-w-0">
                            {/* Type badge */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getNotificationTypeColor(notification.type)}`}>
                                {getNotificationTypeLabel(notification.type)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(new Date(notification.timestamp))}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className={`font-medium text-sm mb-0.5 ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>

                            {/* Message */}
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {notification.actionUrl && (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleRemove(e, notification.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t bg-muted/30">
                <Link href="/profile/notifications">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      haptic.selection();
                      onClose();
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Настройки уведомлений
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
