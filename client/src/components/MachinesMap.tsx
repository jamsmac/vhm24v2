/**
 * Interactive Machines Map Component
 * Displays all vending machines on a Google Map with status filtering
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MapView } from "./Map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  WifiOff, 
  Wrench, 
  MapPin,
  Navigation,
  X,
  Filter,
  Coffee,
  Route,
  ExternalLink,
  Footprints,
  Car,
  Loader2
} from "lucide-react";
import { useRouteNavigation, TravelMode } from "@/hooks/useRouteNavigation";
import { cn } from "@/lib/utils";

// Machine type definition
export interface Machine {
  id: number;
  machineCode: string;
  name: string;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  status: 'online' | 'offline' | 'maintenance';
  imageUrl?: string | null;
}

interface MachinesMapProps {
  machines: Machine[];
  className?: string;
  onMachineSelect?: (machine: Machine) => void;
  showFilters?: boolean;
  showRouteNavigation?: boolean;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
}

// Status configuration for markers
const statusConfig = {
  online: {
    color: '#22c55e', // green-500
    bgColor: 'bg-green-500',
    label: 'Онлайн',
    icon: Wifi,
  },
  offline: {
    color: '#ef4444', // red-500
    bgColor: 'bg-red-500',
    label: 'Офлайн',
    icon: WifiOff,
  },
  maintenance: {
    color: '#f59e0b', // amber-500
    bgColor: 'bg-amber-500',
    label: 'Обслуживание',
    icon: Wrench,
  },
};

// Create custom marker element
function createMarkerContent(machine: Machine): HTMLElement {
  const config = statusConfig[machine.status];
  
  const container = document.createElement('div');
  container.className = 'relative cursor-pointer transform transition-transform hover:scale-110';
  
  // Marker pin
  const pin = document.createElement('div');
  pin.className = 'relative';
  pin.innerHTML = `
    <div class="relative">
      <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 30 20 30s20-16 20-30C40 8.954 31.046 0 20 0z" fill="${config.color}"/>
        <circle cx="20" cy="18" r="12" fill="white"/>
      </svg>
      <div class="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${config.color}" stroke="${config.color}" stroke-width="2">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
          <line x1="6" x2="6" y1="2" y2="4"/>
          <line x1="10" x2="10" y1="2" y2="4"/>
          <line x1="14" x2="14" y1="2" y2="4"/>
        </svg>
      </div>
    </div>
  `;
  
  // Status indicator
  const statusDot = document.createElement('div');
  statusDot.className = `absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${config.bgColor}`;
  if (machine.status === 'online') {
    statusDot.innerHTML = '<div class="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>';
  }
  
  pin.appendChild(statusDot);
  container.appendChild(pin);
  
  return container;
}

export function MachinesMap({
  machines,
  className,
  onMachineSelect,
  showFilters = true,
  showRouteNavigation = true,
  initialCenter = { lat: 41.311081, lng: 69.240562 }, // Tashkent default
  initialZoom = 12,
}: MachinesMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'maintenance'>('all');
  const [isMapReady, setIsMapReady] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  
  // Route navigation hook
  const {
    isCalculating,
    routeInfo,
    error: routeError,
    travelMode,
    setTravelMode,
    calculateRoute,
    clearRoute,
    openInExternalMaps,
  } = useRouteNavigation({ map: mapRef.current });

  // Filter machines based on status
  const filteredMachines = machines.filter(machine => {
    if (statusFilter === 'all') return true;
    return machine.status === statusFilter;
  });

  // Count machines by status
  const statusCounts = {
    all: machines.length,
    online: machines.filter(m => m.status === 'online').length,
    offline: machines.filter(m => m.status === 'offline').length,
    maintenance: machines.filter(m => m.status === 'maintenance').length,
  };

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];
  }, []);

  // Create info window content
  const createInfoWindowContent = (machine: Machine): string => {
    const config = statusConfig[machine.status];
    return `
      <div class="p-3 min-w-[200px]">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-semibold text-gray-900">${machine.name}</span>
          <span class="px-2 py-0.5 text-xs rounded-full text-white" style="background-color: ${config.color}">
            ${config.label}
          </span>
        </div>
        <div class="text-sm text-gray-600 mb-1">
          <strong>Код:</strong> ${machine.machineCode}
        </div>
        ${machine.address ? `
          <div class="text-sm text-gray-600 mb-2">
            <strong>Адрес:</strong> ${machine.address}
          </div>
        ` : ''}
        <button 
          onclick="window.dispatchEvent(new CustomEvent('selectMachine', { detail: ${machine.id} }))"
          class="w-full mt-2 px-3 py-1.5 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 transition-colors"
        >
          Подробнее
        </button>
      </div>
    `;
  };

  // Add markers to map
  const addMarkers = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    clearMarkers();

    // Create info window if not exists
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    filteredMachines.forEach(machine => {
      if (!machine.latitude || !machine.longitude) return;

      const lat = parseFloat(machine.latitude);
      const lng = parseFloat(machine.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat, lng },
        title: machine.name,
        content: createMarkerContent(machine),
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current && mapRef.current) {
          infoWindowRef.current.setContent(createInfoWindowContent(machine));
          infoWindowRef.current.open(mapRef.current, marker);
          setSelectedMachine(machine);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0 && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        if (marker.position) {
          bounds.extend(marker.position as google.maps.LatLng);
        }
      });
      
      // Only fit bounds if there are multiple markers
      if (markersRef.current.length > 1) {
        mapRef.current.fitBounds(bounds, 50);
      } else if (markersRef.current.length === 1) {
        const pos = markersRef.current[0].position;
        if (pos) {
          mapRef.current.setCenter(pos as google.maps.LatLng);
          mapRef.current.setZoom(15);
        }
      }
    }
  }, [filteredMachines, clearMarkers]);

  // Handle map ready
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsMapReady(true);
  }, []);

  // Update markers when filter changes or map is ready
  useEffect(() => {
    if (isMapReady) {
      addMarkers();
    }
  }, [isMapReady, addMarkers, statusFilter]);

  // Listen for machine selection from info window
  useEffect(() => {
    const handleSelectMachine = (event: CustomEvent<number>) => {
      const machine = machines.find(m => m.id === event.detail);
      if (machine && onMachineSelect) {
        onMachineSelect(machine);
      }
    };

    window.addEventListener('selectMachine', handleSelectMachine as EventListener);
    return () => {
      window.removeEventListener('selectMachine', handleSelectMachine as EventListener);
    };
  }, [machines, onMachineSelect]);

  // Navigate to user's location
  const goToMyLocation = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapRef.current?.setCenter(pos);
          mapRef.current?.setZoom(14);
        },
        () => {
          console.error('Error getting location');
        }
      );
    }
  };

  // Center on selected machine
  const centerOnMachine = (machine: Machine) => {
    if (!mapRef.current || !machine.latitude || !machine.longitude) return;
    
    const lat = parseFloat(machine.latitude);
    const lng = parseFloat(machine.longitude);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(16);
      setSelectedMachine(machine);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Filters */}
      {showFilters && (
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={cn(
              "shadow-md",
              statusFilter === 'all' && "bg-amber-600 hover:bg-amber-700"
            )}
          >
            <Filter className="w-4 h-4 mr-1" />
            Все ({statusCounts.all})
          </Button>
          <Button
            variant={statusFilter === 'online' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('online')}
            className={cn(
              "shadow-md",
              statusFilter === 'online' && "bg-green-600 hover:bg-green-700"
            )}
          >
            <Wifi className="w-4 h-4 mr-1" />
            Онлайн ({statusCounts.online})
          </Button>
          <Button
            variant={statusFilter === 'offline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('offline')}
            className={cn(
              "shadow-md",
              statusFilter === 'offline' && "bg-red-600 hover:bg-red-700"
            )}
          >
            <WifiOff className="w-4 h-4 mr-1" />
            Офлайн ({statusCounts.offline})
          </Button>
          <Button
            variant={statusFilter === 'maintenance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('maintenance')}
            className={cn(
              "shadow-md",
              statusFilter === 'maintenance' && "bg-amber-500 hover:bg-amber-600"
            )}
          >
            <Wrench className="w-4 h-4 mr-1" />
            ТО ({statusCounts.maintenance})
          </Button>
        </div>
      )}

      {/* My Location Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={goToMyLocation}
        className="absolute top-4 right-4 z-10 shadow-md bg-white"
        title="Моё местоположение"
      >
        <Navigation className="w-4 h-4" />
      </Button>

      {/* Map */}
      <MapView
        className="w-full h-full min-h-[400px] rounded-lg"
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        onMapReady={handleMapReady}
      />

      {/* Selected Machine Card */}
      {selectedMachine && (
        <Card className="absolute bottom-4 left-4 right-4 z-10 shadow-lg max-w-md mx-auto">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Coffee className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold">{selectedMachine.name}</h3>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-white",
                      statusConfig[selectedMachine.status].bgColor
                    )}
                  >
                    {statusConfig[selectedMachine.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Код: {selectedMachine.machineCode}
                </p>
                {selectedMachine.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedMachine.address}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMachine(null)}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              {showRouteNavigation && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRoutePanel(!showRoutePanel)}
                >
                  <Route className="w-4 h-4 mr-2" />
                  Маршрут
                </Button>
              )}
              {onMachineSelect && (
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={() => onMachineSelect(selectedMachine)}
                >
                  Подробнее
                </Button>
              )}
            </div>
            
            {/* Route Panel */}
            {showRoutePanel && showRouteNavigation && (
              <div className="mt-4 pt-4 border-t space-y-3">
                {/* Travel Mode Selector */}
                <div className="flex gap-2">
                  <Button
                    variant={travelMode === 'WALKING' ? 'default' : 'outline'}
                    size="sm"
                    className={cn("flex-1", travelMode === 'WALKING' && "bg-amber-600 hover:bg-amber-700")}
                    onClick={() => setTravelMode('WALKING')}
                    disabled={isCalculating}
                  >
                    <Footprints className="w-4 h-4 mr-1" />
                    Пешком
                  </Button>
                  <Button
                    variant={travelMode === 'DRIVING' ? 'default' : 'outline'}
                    size="sm"
                    className={cn("flex-1", travelMode === 'DRIVING' && "bg-amber-600 hover:bg-amber-700")}
                    onClick={() => setTravelMode('DRIVING')}
                    disabled={isCalculating}
                  >
                    <Car className="w-4 h-4 mr-1" />
                    На авто
                  </Button>
                </div>
                
                {/* Route Error */}
                {routeError && (
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                    {routeError}
                  </div>
                )}
                
                {/* Route Info */}
                {routeInfo && (
                  <div className="flex items-center gap-4 p-2 rounded-lg bg-secondary text-sm">
                    <div className="flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-amber-600" />
                      <span className="font-medium">{routeInfo.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">~{routeInfo.duration}</span>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!routeInfo ? (
                    <Button
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                      onClick={async () => {
                        if (selectedMachine?.latitude && selectedMachine?.longitude) {
                          await calculateRoute('current', {
                            lat: parseFloat(selectedMachine.latitude),
                            lng: parseFloat(selectedMachine.longitude),
                          });
                        }
                      }}
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
                        onClick={() => {
                          clearRoute();
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Очистить
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (selectedMachine?.latitude && selectedMachine?.longitude) {
                            openInExternalMaps(
                              { lat: parseFloat(selectedMachine.latitude), lng: parseFloat(selectedMachine.longitude) },
                              selectedMachine.name,
                              'google'
                            );
                          }
                        }}
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
                      onClick={() => {
                        if (selectedMachine?.latitude && selectedMachine?.longitude) {
                          openInExternalMaps(
                            { lat: parseFloat(selectedMachine.latitude), lng: parseFloat(selectedMachine.longitude) },
                            selectedMachine.name,
                            'google'
                          );
                        }
                      }}
                    >
                      Google Maps
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        if (selectedMachine?.latitude && selectedMachine?.longitude) {
                          openInExternalMaps(
                            { lat: parseFloat(selectedMachine.latitude), lng: parseFloat(selectedMachine.longitude) },
                            selectedMachine.name,
                            'yandex'
                          );
                        }
                      }}
                    >
                      Яндекс Карты
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {filteredMachines.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
          <Card className="p-6 text-center">
            <Coffee className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {statusFilter === 'all' 
                ? 'Нет автоматов для отображения'
                : `Нет автоматов со статусом "${statusConfig[statusFilter].label}"`
              }
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

// Mini map component for list items
export function MachinesMiniMap({
  machines,
  className,
  onMachineClick,
}: {
  machines: Machine[];
  className?: string;
  onMachineClick?: (machine: Machine) => void;
}) {
  return (
    <MachinesMap
      machines={machines}
      className={cn("h-[300px]", className)}
      onMachineSelect={onMachineClick}
      showFilters={false}
      initialZoom={11}
    />
  );
}
