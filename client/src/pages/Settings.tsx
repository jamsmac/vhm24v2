/**
 * VendHub TWA - Settings Page
 * "Warm Brew" Design System
 * Full Telegram themeParams integration
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTelegram } from "@/contexts/TelegramContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, Globe, Bell, Moon, Sun, Shield, ChevronRight, Check, Smartphone, RotateCcw, Monitor, Send, Palette } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export default function Settings() {
  const { haptic, isTelegram } = useTelegram();
  const { theme, themeMode, setThemeMode, isTelegramAvailable, telegramThemeParams } = useTheme();
  const { resetOnboarding } = useOnboardingStore();
  const [language, setLanguage] = useState('ru');
  const [notifications, setNotifications] = useState(true);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showThemeParams, setShowThemeParams] = useState(false);

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

  const handleThemeModeChange = (mode: 'light' | 'dark' | 'auto' | 'telegram') => {
    haptic.impact('medium');
    setThemeMode(mode);
    
    const messages: Record<string, { text: string; icon: string }> = {
      light: { text: 'Светлая тема включена', icon: '☀️' },
      dark: { text: 'Тёмная тема включена', icon: '🌙' },
      auto: { text: 'Системная тема включена', icon: '🔄' },
      telegram: { text: 'Тема Telegram включена', icon: '✈️' },
    };
    
    toast.success(messages[mode].text, { icon: messages[mode].icon });
  };

  const currentLang = languages.find(l => l.code === language);
  const isDarkMode = theme === 'dark';
  const isAutoMode = themeMode === 'auto';
  const isTelegramMode = themeMode === 'telegram';

  // Get icon and description based on current mode
  const getThemeIcon = () => {
    if (isTelegramMode) return <Send className="w-5 h-5 text-sky-500" />;
    if (isAutoMode) return <Monitor className="w-5 h-5 text-blue-500" />;
    if (isDarkMode) return <Moon className="w-5 h-5 text-indigo-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  const getThemeDescription = () => {
    if (isTelegramMode) return 'Telegram';
    if (isAutoMode) return 'Системная';
    if (isDarkMode) return 'Тёмная';
    return 'Светлая';
  };

  const getThemeIconBg = () => {
    if (isTelegramMode) return 'bg-sky-500/20';
    if (isAutoMode) return 'bg-blue-500/20';
    if (isDarkMode) return 'bg-indigo-500/20';
    return 'bg-amber-500/20';
  };

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
          
          {/* Theme Mode */}
          <Card className="coffee-card overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${getThemeIconBg()}`}>
                  {getThemeIcon()}
                </div>
                <div>
                  <p className="font-medium text-foreground">Тема оформления</p>
                  <p className="text-sm text-muted-foreground">
                    {getThemeDescription()}
                  </p>
                </div>
              </div>
              <Switch 
                checked={isDarkMode && !isAutoMode && !isTelegramMode} 
                onCheckedChange={(checked) => handleThemeModeChange(checked ? 'dark' : 'light')}
              />
            </div>
            
            {/* Theme Preview */}
            <motion.div 
              className="mt-4 pt-4 border-t border-border"
              initial={false}
              animate={{ opacity: 1 }}
            >
              <div className={`grid gap-2 ${isTelegramAvailable ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {/* Light Theme Preview */}
                <button
                  onClick={() => handleThemeModeChange('light')}
                  className={`p-2 rounded-xl border-2 transition-all ${
                    themeMode === 'light' 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="bg-[#FDF8F3] rounded-lg p-1.5 mb-1.5 aspect-[4/3] flex flex-col justify-center">
                    <div className="h-1.5 w-6 bg-[#5D4037] rounded mb-0.5 mx-auto" />
                    <div className="h-1 w-8 bg-[#D4A574] rounded mx-auto" />
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Sun className="w-3 h-3 text-amber-500" />
                    <p className="text-[10px] font-medium">Светлая</p>
                  </div>
                </button>
                
                {/* Dark Theme Preview */}
                <button
                  onClick={() => handleThemeModeChange('dark')}
                  className={`p-2 rounded-xl border-2 transition-all ${
                    themeMode === 'dark' 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="bg-[#1a1a1a] rounded-lg p-1.5 mb-1.5 aspect-[4/3] flex flex-col justify-center">
                    <div className="h-1.5 w-6 bg-[#D4A574] rounded mb-0.5 mx-auto" />
                    <div className="h-1 w-8 bg-[#8B7355] rounded mx-auto" />
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Moon className="w-3 h-3 text-indigo-500" />
                    <p className="text-[10px] font-medium">Тёмная</p>
                  </div>
                </button>
                
                {/* Auto Theme Preview */}
                <button
                  onClick={() => handleThemeModeChange('auto')}
                  className={`p-2 rounded-xl border-2 transition-all ${
                    themeMode === 'auto' 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="rounded-lg mb-1.5 aspect-[4/3] overflow-hidden flex">
                    <div className="w-1/2 bg-[#FDF8F3] p-1 flex flex-col justify-center">
                      <div className="h-1 w-3 bg-[#5D4037] rounded mb-0.5" />
                      <div className="h-0.5 w-4 bg-[#D4A574] rounded" />
                    </div>
                    <div className="w-1/2 bg-[#1a1a1a] p-1 flex flex-col justify-center items-end">
                      <div className="h-1 w-3 bg-[#D4A574] rounded mb-0.5" />
                      <div className="h-0.5 w-4 bg-[#8B7355] rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Monitor className="w-3 h-3 text-blue-500" />
                    <p className="text-[10px] font-medium">Система</p>
                  </div>
                </button>
                
                {/* Telegram Theme Preview - only show if in Telegram */}
                {isTelegramAvailable && (
                  <button
                    onClick={() => handleThemeModeChange('telegram')}
                    className={`p-2 rounded-xl border-2 transition-all ${
                      themeMode === 'telegram' 
                        ? 'border-sky-500 ring-2 ring-sky-500/20' 
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div 
                      className="rounded-lg mb-1.5 aspect-[4/3] flex items-center justify-center"
                      style={{
                        background: telegramThemeParams?.button_color 
                          ? `linear-gradient(135deg, ${telegramThemeParams.button_color}, ${telegramThemeParams.link_color || telegramThemeParams.button_color})`
                          : 'linear-gradient(135deg, #2481cc, #1d6fa5)'
                      }}
                    >
                      <Send className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Send className="w-3 h-3 text-sky-500" />
                      <p className="text-[10px] font-medium">Telegram</p>
                    </div>
                  </button>
                )}
              </div>
              
              {/* Mode hints */}
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                {isAutoMode && (
                  <p className="text-xs text-muted-foreground text-center">
                    Тема меняется в зависимости от настроек вашего устройства
                  </p>
                )}
                {isTelegramMode && (
                  <p className="text-xs text-muted-foreground text-center">
                    Тема и цвета синхронизируются с настройками Telegram
                  </p>
                )}
              </motion.div>
            </motion.div>
            
            {/* Telegram Theme Params Info - only show when in Telegram mode */}
            {isTelegramMode && telegramThemeParams && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-border"
              >
                <button
                  onClick={() => {
                    haptic.selection();
                    setShowThemeParams(!showThemeParams);
                  }}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
                      <Palette className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Цвета Telegram</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showThemeParams ? 'rotate-90' : ''}`} />
                </button>
                
                {showThemeParams && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 space-y-2"
                  >
                    {/* Color swatches */}
                    <div className="grid grid-cols-2 gap-2">
                      {telegramThemeParams.bg_color && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                          <div 
                            className="w-6 h-6 rounded-md border border-border"
                            style={{ backgroundColor: telegramThemeParams.bg_color }}
                          />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Фон</p>
                            <p className="text-xs font-mono">{telegramThemeParams.bg_color}</p>
                          </div>
                        </div>
                      )}
                      {telegramThemeParams.text_color && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                          <div 
                            className="w-6 h-6 rounded-md border border-border"
                            style={{ backgroundColor: telegramThemeParams.text_color }}
                          />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Текст</p>
                            <p className="text-xs font-mono">{telegramThemeParams.text_color}</p>
                          </div>
                        </div>
                      )}
                      {telegramThemeParams.button_color && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                          <div 
                            className="w-6 h-6 rounded-md border border-border"
                            style={{ backgroundColor: telegramThemeParams.button_color }}
                          />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Кнопка</p>
                            <p className="text-xs font-mono">{telegramThemeParams.button_color}</p>
                          </div>
                        </div>
                      )}
                      {telegramThemeParams.link_color && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                          <div 
                            className="w-6 h-6 rounded-md border border-border"
                            style={{ backgroundColor: telegramThemeParams.link_color }}
                          />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Ссылка</p>
                            <p className="text-xs font-mono">{telegramThemeParams.link_color}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Demo button with Telegram colors */}
                    <div className="pt-2">
                      <button 
                        className="w-full btn-telegram"
                        onClick={() => {
                          haptic.impact('light');
                          toast.success('Кнопка в стиле Telegram!', { icon: '✈️' });
                        }}
                      >
                        Кнопка Telegram
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
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

        {/* Tutorial Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">Обучение</h2>
          <Card className="coffee-card">
            <button 
              className="w-full flex items-center justify-between"
              onClick={() => {
                haptic.impact('medium');
                resetOnboarding();
                toast.success('Приветственные экраны будут показаны при следующем запуске', {
                  icon: '👋',
                });
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-[#5D4037] dark:text-[#D4A574]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Показать обучение</p>
                  <p className="text-sm text-muted-foreground">Посмотреть приветственные экраны</p>
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
          {isTelegram && (
            <p className="text-xs text-sky-500 mt-2 flex items-center justify-center gap-1">
              <Send className="w-3 h-3" />
              Запущено в Telegram
            </p>
          )}
        </motion.div>
      </main>

      <div className="h-24" />
    </div>
  );
}
