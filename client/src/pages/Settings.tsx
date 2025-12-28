/**
 * VendHub TWA - Settings Page
 * "Warm Brew" Design System
 * Dark theme toggle enabled
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTelegram } from "@/contexts/TelegramContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, Globe, Bell, Moon, Sun, Shield, ChevronRight, Check, Smartphone } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export default function Settings() {
  const { haptic } = useTelegram();
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState('ru');
  const [notifications, setNotifications] = useState(true);
  const [showLanguages, setShowLanguages] = useState(false);

  const handleLanguageChange = (code: string) => {
    haptic.selection();
    setLanguage(code);
    setShowLanguages(false);
    toast.success('Язык изменён');
  };

  const handleNotificationsChange = (checked: boolean) => {
    haptic.selection();
    setNotifications(checked);
    toast.success(checked ? 'Уведомления включены' : 'Уведомления отключены');
  };

  const handleDarkModeChange = (checked: boolean) => {
    haptic.impact('medium');
    if (toggleTheme) {
      toggleTheme();
      toast.success(checked ? 'Тёмная тема включена' : 'Светлая тема включена', {
        icon: checked ? '🌙' : '☀️',
      });
    }
  };

  const currentLang = languages.find(l => l.code === language);
  const isDarkMode = theme === 'dark';

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-display text-xl font-bold">Настройки</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Theme Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">Оформление</h2>
          
          {/* Dark Mode */}
          <Card className="coffee-card overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDarkMode ? 'bg-indigo-500/20' : 'bg-amber-500/20'
                }`}>
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Тёмная тема</p>
                  <p className="text-sm text-muted-foreground">
                    {isDarkMode ? 'Включена' : 'Выключена'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={isDarkMode} 
                onCheckedChange={handleDarkModeChange}
              />
            </div>
            
            {/* Theme Preview */}
            <motion.div 
              className="mt-4 pt-4 border-t border-border"
              initial={false}
              animate={{ opacity: 1 }}
            >
              <div className="flex gap-3">
                {/* Light Theme Preview */}
                <button
                  onClick={() => {
                    if (isDarkMode && toggleTheme) {
                      haptic.selection();
                      toggleTheme();
                      toast.success('Светлая тема включена', { icon: '☀️' });
                    }
                  }}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    !isDarkMode 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="bg-[#FDF8F3] rounded-lg p-2 mb-2">
                    <div className="h-2 w-8 bg-[#5D4037] rounded mb-1" />
                    <div className="h-1.5 w-12 bg-[#D4A574] rounded" />
                  </div>
                  <p className="text-xs font-medium">Светлая</p>
                </button>
                
                {/* Dark Theme Preview */}
                <button
                  onClick={() => {
                    if (!isDarkMode && toggleTheme) {
                      haptic.selection();
                      toggleTheme();
                      toast.success('Тёмная тема включена', { icon: '🌙' });
                    }
                  }}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    isDarkMode 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="bg-[#1a1a1a] rounded-lg p-2 mb-2">
                    <div className="h-2 w-8 bg-[#D4A574] rounded mb-1" />
                    <div className="h-1.5 w-12 bg-[#8B7355] rounded" />
                  </div>
                  <p className="text-xs font-medium">Тёмная</p>
                </button>
              </div>
            </motion.div>
          </Card>
        </motion.div>

        {/* Language Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">Язык и регион</h2>
          <Card className="coffee-card">
            <button 
              className="w-full flex items-center justify-between"
              onClick={() => {
                haptic.selection();
                setShowLanguages(!showLanguages);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#5D4037] dark:text-[#D4A574]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Язык приложения</p>
                  <p className="text-sm text-muted-foreground">{currentLang?.flag} {currentLang?.name}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showLanguages ? 'rotate-90' : ''}`} />
            </button>
            
            {showLanguages && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 pt-4 border-t border-border space-y-2"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      language === lang.code ? 'bg-primary/10' : 'hover:bg-secondary'
                    }`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                    </div>
                    {language === lang.code && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">Уведомления</h2>
          <Card className="coffee-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#5D4037] dark:text-[#D4A574]" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Push-уведомления</p>
                  <p className="text-sm text-muted-foreground">О заказах и акциях</p>
                </div>
              </div>
              <Switch 
                checked={notifications} 
                onCheckedChange={handleNotificationsChange}
              />
            </div>
            
            <Link href="/profile/notifications">
              <button className="w-full mt-4 pt-4 border-t border-border flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-[#5D4037] dark:text-[#D4A574]" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Настройки уведомлений</p>
                    <p className="text-sm text-muted-foreground">Выбрать типы уведомлений</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>
          </Card>
        </motion.div>

        {/* Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">Конфиденциальность</h2>
          <Card className="coffee-card">
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#5D4037] dark:text-[#D4A574]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Политика конфиденциальности</p>
                  <p className="text-sm text-muted-foreground">Как мы используем ваши данные</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="text-center pt-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5D4037] to-[#8B7355] mb-3">
            <span className="text-2xl">☕</span>
          </div>
          <p className="font-medium text-foreground">VendHub Coffee</p>
          <p className="text-sm text-muted-foreground">Версия 1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">© 2024 VendHub. Все права защищены.</p>
        </motion.div>
      </main>

      <div className="h-24" />
    </div>
  );
}
