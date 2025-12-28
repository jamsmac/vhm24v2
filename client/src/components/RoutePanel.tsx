import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  X, 
  Clock, 
  MapPin, 
  Footprints, 
  Car, 
  Bus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RouteInfo, TravelMode } from '@/hooks/useRouteNavigation';

interface RoutePanelProps {
  routeInfo: RouteInfo | null;
  isCalculating: boolean;
  error: string | null;
  travelMode: TravelMode;
  destinationName: string;
  destinationAddress?: string;
  onTravelModeChange: (mode: TravelMode) => void;
  onBuildRoute: () => void;
  onClearRoute: () => void;
  onOpenExternal: (app: 'google' | 'yandex') => void;
  className?: string;
}

export function RoutePanel({
  routeInfo,
  isCalculating,
  error,
  travelMode,
  destinationName,
  destinationAddress,
  onTravelModeChange,
  onBuildRoute,
  onClearRoute,
  onOpenExternal,
  className,
}: RoutePanelProps) {
  const [showSteps, setShowSteps] = useState(false);

  const travelModes: { mode: TravelMode; icon: typeof Footprints; label: string }[] = [
    { mode: 'WALKING', icon: Footprints, label: 'Пешком' },
    { mode: 'DRIVING', icon: Car, label: 'На авто' },
    { mode: 'TRANSIT', icon: Bus, label: 'Транспорт' },
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Destination Info */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <MapPin className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{destinationName}</h3>
            {destinationAddress && (
              <p className="text-sm text-muted-foreground truncate">{destinationAddress}</p>
            )}
          </div>
        </div>

        {/* Travel Mode Selector */}
        <div className="flex gap-2">
          {travelModes.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant={travelMode === mode ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex-1",
                travelMode === mode && "bg-amber-600 hover:bg-amber-700"
              )}
              onClick={() => onTravelModeChange(mode)}
              disabled={isCalculating}
            >
              <Icon className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Route Info */}
        {routeInfo && !error && (
          <div className="space-y-3">
            {/* Distance and Duration */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-600" />
                <span className="font-semibold">{routeInfo.distance}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-semibold">{routeInfo.duration}</span>
              </div>
            </div>

            {/* Route Steps Toggle */}
            {routeInfo.steps.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => setShowSteps(!showSteps)}
              >
                <span>Подробный маршрут ({routeInfo.steps.length} шагов)</span>
                {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}

            {/* Route Steps */}
            {showSteps && (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {routeInfo.steps.map((step, index) => (
                  <div 
                    key={index} 
                    className="flex gap-3 p-2 rounded-lg bg-secondary/50 text-sm"
                  >
                    <Badge variant="outline" className="h-6 w-6 p-0 justify-center shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">{step.instruction}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.distance} • {step.duration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!routeInfo ? (
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={onBuildRoute}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Построение...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Построить маршрут
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClearRoute}
              >
                <X className="w-4 h-4 mr-2" />
                Очистить
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenExternal('google')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* External Maps Links */}
        {routeInfo && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onOpenExternal('google')}
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google Maps" 
                className="w-4 h-4 mr-1"
              />
              Google Maps
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onOpenExternal('yandex')}
            >
              <img 
                src="https://yandex.ru/favicon.ico" 
                alt="Яндекс Карты" 
                className="w-4 h-4 mr-1"
              />
              Яндекс Карты
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RoutePanel;
