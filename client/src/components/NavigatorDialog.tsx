/**
 * Navigator Selection Dialog
 * Design: Warm Brew coffee theme
 * Allows users to choose their preferred navigation app
 * Supports "Remember my choice" feature with localStorage
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Navigation, MapPin, ExternalLink, Check, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const STORAGE_KEY = 'vendhub_preferred_navigator';

interface NavigatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination: {
    lat: number;
    lng: number;
    name: string;
    address: string;
  } | null;
}

interface NavigatorOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  getUrl: (lat: number, lng: number, name: string) => string;
}

const navigators: NavigatorOption[] = [
  {
    id: 'google',
    name: 'Google Maps',
    icon: '🗺️',
    color: 'bg-blue-500 hover:bg-blue-600',
    getUrl: (lat, lng) => 
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`
  },
  {
    id: 'yandex',
    name: 'Яндекс.Карты',
    icon: '🔴',
    color: 'bg-red-500 hover:bg-red-600',
    getUrl: (lat, lng, name) => 
      `https://yandex.uz/maps/?rtext=~${lat},${lng}&rtt=pd&z=16`
  },
  {
    id: '2gis',
    name: '2GIS',
    icon: '🟢',
    color: 'bg-green-600 hover:bg-green-700',
    getUrl: (lat, lng, name) => 
      `https://2gis.uz/tashkent/directions/points/%2C${lng}%2C${lat}?m=${lng}%2C${lat}%2F16`
  }
];

// Get saved navigator preference
const getSavedNavigator = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

// Save navigator preference
const saveNavigatorPreference = (navigatorId: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, navigatorId);
  } catch {
    // Ignore storage errors
  }
};

// Clear navigator preference
const clearNavigatorPreference = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};

export function NavigatorDialog({ open, onOpenChange, destination }: NavigatorDialogProps) {
  const [rememberChoice, setRememberChoice] = useState(false);
  const [savedNavigatorId, setSavedNavigatorId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Check for saved preference on mount and when dialog opens
  useEffect(() => {
    if (open) {
      const saved = getSavedNavigator();
      setSavedNavigatorId(saved);
      
      // If we have a saved preference and destination, auto-open
      if (saved && destination) {
        const navigator = navigators.find(n => n.id === saved);
        if (navigator) {
          // Small delay to show the dialog briefly before redirecting
          const timer = setTimeout(() => {
            const url = navigator.getUrl(destination.lat, destination.lng, destination.name);
            window.open(url, '_blank');
            onOpenChange(false);
            toast.success(`Открываем ${navigator.name}`, {
              description: 'Используется сохранённый навигатор',
              action: {
                label: 'Изменить',
                onClick: () => {
                  clearNavigatorPreference();
                  setSavedNavigatorId(null);
                  toast.info('Настройка сброшена');
                }
              }
            });
          }, 300);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [open, destination, onOpenChange]);

  const handleSelectNavigator = (navigator: NavigatorOption) => {
    if (!destination) return;
    
    // Save preference if checkbox is checked
    if (rememberChoice) {
      saveNavigatorPreference(navigator.id);
      setSavedNavigatorId(navigator.id);
      toast.success(`${navigator.name} сохранён как основной`, {
        description: 'Можно изменить в настройках профиля'
      });
    }
    
    const url = navigator.getUrl(destination.lat, destination.lng, destination.name);
    window.open(url, '_blank');
    onOpenChange(false);
  };

  const handleClearPreference = () => {
    clearNavigatorPreference();
    setSavedNavigatorId(null);
    setShowSettings(false);
    toast.success('Настройка навигатора сброшена');
  };

  const savedNavigator = navigators.find(n => n.id === savedNavigatorId);

  // If auto-opening with saved preference, show minimal loading state
  if (open && savedNavigatorId && destination && !showSettings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
          <div className="flex flex-col items-center justify-center py-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-espresso to-espresso/80 flex items-center justify-center mb-4"
            >
              <Navigation className="w-8 h-8 text-white animate-pulse" />
            </motion.div>
            <p className="text-lg font-display font-semibold">Открываем {savedNavigator?.name}...</p>
            <p className="text-sm text-muted-foreground mt-1">{destination.name}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-muted-foreground"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Выбрать другой
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-espresso to-espresso/80 flex items-center justify-center mb-3">
            <Navigation className="w-7 h-7 text-white" />
          </div>
          <DialogTitle className="font-display text-xl">Построить маршрут</DialogTitle>
          {destination && (
            <div className="mt-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="font-medium text-foreground">{destination.name}</span>
              </div>
              <p className="mt-1">{destination.address}</p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground text-center">
            Выберите приложение для навигации:
          </p>
          
          <div className="space-y-2">
            {navigators.map((navigator, index) => (
              <motion.div
                key={navigator.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className={`w-full h-14 justify-between rounded-xl border-2 transition-all group ${
                    savedNavigatorId === navigator.id 
                      ? 'border-espresso bg-espresso/5' 
                      : 'hover:border-espresso/30'
                  }`}
                  onClick={() => handleSelectNavigator(navigator)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{navigator.icon}</span>
                    <span className="font-semibold text-foreground">{navigator.name}</span>
                    {savedNavigatorId === navigator.id && (
                      <span className="text-xs bg-espresso/10 text-espresso px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Основной
                      </span>
                    )}
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-espresso transition-colors" />
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Remember choice checkbox */}
          {!savedNavigatorId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 pt-2"
            >
              <Checkbox
                id="remember"
                checked={rememberChoice}
                onCheckedChange={(checked) => setRememberChoice(checked === true)}
                className="border-espresso/50 data-[state=checked]:bg-espresso data-[state=checked]:border-espresso"
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Запомнить мой выбор
              </label>
            </motion.div>
          )}

          {/* Clear saved preference */}
          {savedNavigatorId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center pt-2"
            >
              <button
                onClick={handleClearPreference}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
              >
                Сбросить выбор навигатора
              </button>
            </motion.div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => {
              setShowSettings(false);
              onOpenChange(false);
            }}
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NavigatorDialog;
