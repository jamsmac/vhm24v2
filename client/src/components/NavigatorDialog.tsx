/**
 * Navigator Selection Dialog
 * Design: Warm Brew coffee theme
 * Allows users to choose their preferred navigation app
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

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

export function NavigatorDialog({ open, onOpenChange, destination }: NavigatorDialogProps) {
  const handleSelectNavigator = (navigator: NavigatorOption) => {
    if (!destination) return;
    
    const url = navigator.getUrl(destination.lat, destination.lng, destination.name);
    window.open(url, '_blank');
    onOpenChange(false);
  };

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
                  className={`w-full h-14 justify-between rounded-xl border-2 hover:border-espresso/30 transition-all group`}
                  onClick={() => handleSelectNavigator(navigator)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{navigator.icon}</span>
                    <span className="font-semibold text-foreground">{navigator.name}</span>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-espresso transition-colors" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NavigatorDialog;
