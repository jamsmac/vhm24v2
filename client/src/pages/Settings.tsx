/**
 * VendHub TWA - Settings Page
 * "Warm Brew" Design System
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTelegram } from "@/contexts/TelegramContext";
import { ArrowLeft, Globe, Bell, Moon, Shield, ChevronRight, Check } from "lucide-react";
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
  const [language, setLanguage] = useState('ru');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
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
    haptic.selection();
    setDarkMode(checked);
    toast.info('Тёмная тема скоро будет доступна');
  };

  const currentLang = languages.find(l => l.code === language);

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
        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
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
                  <Globe className="w-5 h-5 text-[#5D4037]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Язык</p>
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
                      language === lang.code ? 'bg-[#5D4037]/10' : 'hover:bg-secondary'
                    }`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                    </div>
                    {language === lang.code && (
                      <Check className="w-5 h-5 text-[#5D4037]" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="coffee-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#5D4037]" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Уведомления</p>
                  <p className="text-sm text-muted-foreground">Push-уведомления о заказах</p>
                </div>
              </div>
              <Switch 
                checked={notifications} 
                onCheckedChange={handleNotificationsChange}
              />
            </div>
          </Card>
        </motion.div>

        {/* Dark Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="coffee-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Moon className="w-5 h-5 text-[#5D4037]" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Тёмная тема</p>
                  <p className="text-sm text-muted-foreground">Скоро</p>
                </div>
              </div>
              <Switch 
                checked={darkMode} 
                onCheckedChange={handleDarkModeChange}
                disabled
              />
            </div>
          </Card>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="coffee-card">
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#5D4037]" />
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
          <p className="text-sm text-muted-foreground">VendHub Coffee</p>
          <p className="text-xs text-muted-foreground">Версия 1.0.0</p>
        </motion.div>
      </main>

      <div className="h-8" />
    </div>
  );
}
