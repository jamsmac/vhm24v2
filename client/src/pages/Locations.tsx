/**
 * VendHub TWA - Locations Page
 * Shows nearby vending machines with interactive map
 * Handles pending order flow - adds drink to cart after selection
 * Features route display on embedded map before opening external navigator
 */

import { useState, useRef, useCallback } from "react";
import { NavigatorDialog } from "@/components/NavigatorDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTelegram } from "@/contexts/TelegramContext";
import { useCartStore, Machine } from "@/stores/cartStore";
import { usePendingOrderStore } from "@/stores/pendingOrderStore";
import { MapView } from "@/components/Map";
import { 
  ArrowLeft, Search, MapPin, Coffee, ChevronRight, Navigation, 
  ShoppingBag, Map, List, ExternalLink, Filter, Clock, 
  Footprints, Car, X, Loader2, Route
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Calculate walking time from distance (average walking speed: 5 km/h)
const calculateWalkingTime = (distanceKm: number): string => {
  const walkingSpeedKmH = 5; // Average walking speed
  const timeInMinutes = Math.round((distanceKm / walkingSpeedKmH) * 60);
  
  if (timeInMinutes < 1) return '< 1 мин';
  if (timeInMinutes === 1) return '1 мин';
  if (timeInMinutes < 60) return `${timeInMinutes} мин`;
  
  const hours = Math.floor(timeInMinutes / 60);
  const mins = timeInMinutes % 60;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} мин`;
};

// Route info interface
interface RouteInfo {
  distance: string;
  duration: string;
  distanceValue: number;
  durationValue: number;
}

type TravelMode = 'WALKING' | 'DRIVING';

// Mock locations data with coordinates - sorted by distance
const mockLocations: Array<Machine & { 
  distance?: number; 
  machineCount: number;
  lat: number;
  lng: number;
}> = [
  {
    id: "1",
    machineNumber: "M-001",
    name: "KIUT Корпус А",
    locationName: "KIUT University",
    address: "ул. Лабзак, 12",
    isAvailable: true,
    distance: 0.3,
    machineCount: 2,
    lat: 41.311081,
    lng: 69.279737,
  },
  {
    id: "2",
    machineNumber: "M-002",
    name: "IT Park Ташкент",
    locationName: "IT Park",
    address: "ул. Мирзо Улугбека, 5",
    isAvailable: true,
    distance: 1.2,
    machineCount: 3,
    lat: 41.340839,
    lng: 69.285515,
  },
  {
    id: "3",
    machineNumber: "M-003",
    name: "Hilton Tashkent",
    locationName: "Hilton Hotel",
    address: "ул. Тараса Шевченко, 47",
    isAvailable: false,
    distance: 2.5,
    machineCount: 1,
    lat: 41.299496,
    lng: 69.240074,
  },
  {
    id: "4",
    machineNumber: "M-004",
    name: "Samarkand Plaza",
    locationName: "ТРЦ Samarkand",
    address: "ул. Амира Темура, 108",
    isAvailable: true,
    distance: 3.8,
    machineCount: 4,
    lat: 41.326545,
    lng: 69.228783,
  },
  {
    id: "5",
    machineNumber: "M-005",
    name: "Westminster University",
    locationName: "WIUT",
    address: "ул. Истиклол, 12",
    isAvailable: true,
    distance: 4.2,
    machineCount: 2,
    lat: 41.337142,
    lng: 69.334106,
  },
];

// Tashkent center coordinates
const TASHKENT_CENTER = { lat: 41.311081, lng: 69.279737 };

export default function Locations() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const { haptic } = useTelegram();
  const { setMachine, addItem } = useCartStore();
  const { pendingDrink, clearPendingDrink } = usePendingOrderStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [navigatorDialogOpen, setNavigatorDialogOpen] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState<{
    lat: number;
    lng: number;
    name: string;
    address: string;
  } | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  
  // Route display state
  const [showingRoute, setShowingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('WALKING');
  const [routeError, setRouteError] = useState<string | null>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Check if we're in order mode (coming from drink detail)
  const isOrderMode = searchParams.includes('order=true');

  const filteredLocations = mockLocations.filter(
    (loc) => {
      // Apply availability filter
      if (showOnlyAvailable && !loc.isAvailable) return false;
      
      // Apply search filter
      return loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address?.toLowerCase().includes(searchQuery.toLowerCase());
    }
  );

  // Count unavailable machines for filter label
  const unavailableCount = mockLocations.filter(loc => !loc.isAvailable).length;

  const handleSelectLocation = (location: typeof mockLocations[0]) => {
    if (!location.isAvailable) {
      haptic.notification('error');
      toast.error('Этот автомат сейчас недоступен');
      return;
    }
    
    haptic.impact('medium');
    
    // Set the selected machine
    setMachine({
      id: location.id,
      machineNumber: location.machineNumber,
      name: location.name,
      locationName: location.locationName,
      address: location.address,
      isAvailable: location.isAvailable,
    });

    // If we have a pending drink (came from drink detail), add it to cart
    if (pendingDrink && isOrderMode) {
      addItem({
        id: pendingDrink.id,
        name: pendingDrink.name,
        price: pendingDrink.price,
        image: pendingDrink.image,
        description: pendingDrink.description,
        category: 'coffee',
        isAvailable: true,
      });
      clearPendingDrink();
      toast.success(`${pendingDrink.name} добавлен в корзину`);
      // Navigate to cart
      navigate('/cart');
    } else {
      // Normal flow - go to menu
      navigate(`/menu/${location.id}`);
    }
  };

  // Initialize directions service and renderer
  const initDirections = useCallback(() => {
    if (!directionsServiceRef.current && window.google) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
    
    if (!directionsRendererRef.current && mapRef.current && window.google) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#D97706', // amber-600
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });
    }
    
    return { 
      service: directionsServiceRef.current, 
      renderer: directionsRendererRef.current 
    };
  }, []);

  // Calculate and display route on map
  const calculateRoute = useCallback(async (destination: { lat: number; lng: number }, mode: TravelMode = travelMode) => {
    setIsCalculatingRoute(true);
    setRouteError(null);
    
    try {
      const { service, renderer } = initDirections();
      
      if (!service || !mapRef.current) {
        throw new Error('Карта не готова');
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Геолокация не поддерживается'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const origin = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode: google.maps.TravelMode[mode],
        unitSystem: google.maps.UnitSystem.METRIC,
        language: 'ru',
      };

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        service.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            let errorMessage = 'Ошибка построения маршрута';
            if (status === google.maps.DirectionsStatus.ZERO_RESULTS) {
              errorMessage = 'Маршрут не найден';
            } else if (status === google.maps.DirectionsStatus.NOT_FOUND) {
              errorMessage = 'Точка не найдена';
            }
            reject(new Error(errorMessage));
          }
        });
      });

      // Display route on map
      if (renderer && mapRef.current) {
        renderer.setMap(mapRef.current);
        renderer.setDirections(result);
      }

      // Extract route info
      const route = result.routes[0];
      const leg = route.legs[0];
      
      setRouteInfo({
        distance: leg.distance?.text || '',
        duration: leg.duration?.text || '',
        distanceValue: leg.distance?.value || 0,
        durationValue: leg.duration?.value || 0,
      });
      
      setShowingRoute(true);
      setTravelMode(mode);
      haptic.notification('success');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка построения маршрута';
      setRouteError(errorMessage);
      haptic.notification('error');
      toast.error(errorMessage);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [travelMode, initDirections, haptic]);

  // Clear route from map
  const clearRoute = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    setRouteInfo(null);
    setShowingRoute(false);
    setRouteError(null);
  }, []);

  // Open in external maps app
  const openInExternalMaps = useCallback((destination: { lat: number; lng: number }, name: string, app: 'google' | 'yandex' = 'google') => {
    const { lat, lng } = destination;
    let url: string;

    if (app === 'google') {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}&travelmode=${travelMode.toLowerCase()}`;
    } else {
      url = `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=${travelMode === 'DRIVING' ? 'auto' : 'pd'}`;
    }

    window.open(url, '_blank');
  }, [travelMode]);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // Add markers for all locations
    mockLocations.forEach((location) => {
      // Create custom marker content
      const markerContent = document.createElement('div');
      markerContent.innerHTML = `
        <div style="
          background: ${location.isAvailable ? '#5D4037' : '#9CA3AF'};
          padding: 8px 12px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.2s;
          border: 3px solid white;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
            <line x1="6" x2="6" y1="2" y2="4"/>
            <line x1="10" x2="10" y1="2" y2="4"/>
            <line x1="14" x2="14" y1="2" y2="4"/>
          </svg>
          <span style="color: white; font-weight: 600; font-size: 12px; white-space: nowrap;">
            ${location.distance} км
          </span>
        </div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: location.lat, lng: location.lng },
        title: location.name,
        content: markerContent,
      });

      // Add click listener
      marker.addListener('click', () => {
        // Clear any existing route when selecting a new location
        clearRoute();
        setSelectedLocationId(location.id);
        // Pan to marker
        map.panTo({ lat: location.lat, lng: location.lng });
        map.setZoom(15);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    const bounds = new google.maps.LatLngBounds();
    mockLocations.forEach(loc => {
      bounds.extend({ lat: loc.lat, lng: loc.lng });
    });
    map.fitBounds(bounds);
  };

  const handleMarkerSelect = (locationId: string) => {
    const location = mockLocations.find(l => l.id === locationId);
    if (location && mapRef.current) {
      // Clear any existing route
      clearRoute();
      mapRef.current.panTo({ lat: location.lat, lng: location.lng });
      mapRef.current.setZoom(16);
      setSelectedLocationId(locationId);
    }
  };

  const selectedLocation = mockLocations.find(l => l.id === selectedLocationId);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={isOrderMode && pendingDrink ? `/drink/${pendingDrink.id}` : "/"}>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold">
                {isOrderMode ? 'Выберите автомат' : 'Автоматы'}
              </h1>
              {isOrderMode && pendingDrink && (
                <p className="text-sm text-muted-foreground">
                  для заказа: {pendingDrink.name}
                </p>
              )}
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center bg-secondary rounded-xl p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-lg h-8 px-3 ${viewMode === 'list' ? 'bg-espresso text-white' : ''}`}
              onClick={() => {
                haptic.selection();
                setViewMode('list');
                clearRoute();
              }}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-lg h-8 px-3 ${viewMode === 'map' ? 'bg-espresso text-white' : ''}`}
              onClick={() => {
                haptic.selection();
                setViewMode('map');
              }}
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск по названию или адресу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-secondary border-0"
          />
        </div>

        {/* Availability Filter */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Только доступные</span>
            {unavailableCount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {unavailableCount} скрыто
              </span>
            )}
          </div>
          <Switch
            checked={showOnlyAvailable}
            onCheckedChange={(checked) => {
              haptic.selection();
              setShowOnlyAvailable(checked);
              if (checked) {
                toast.success('Показаны только доступные автоматы');
              }
            }}
            className="data-[state=checked]:bg-espresso"
          />
        </div>
      </header>

      {/* Pending drink banner */}
      {isOrderMode && pendingDrink && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4"
        >
          <Card className="bg-espresso/10 border-espresso/20 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary">
                <img src={pendingDrink.image} alt={pendingDrink.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{pendingDrink.name}</p>
                <p className="text-sm text-espresso font-semibold">
                  {new Intl.NumberFormat('ru-RU').format(pendingDrink.price)} UZS
                </p>
              </div>
              <ShoppingBag className="w-5 h-5 text-espresso" />
            </div>
          </Card>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'map' ? (
          /* Map View */
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            {/* Map Container */}
            <div className="h-[calc(100vh-180px)]">
              <MapView
                className="w-full h-full"
                initialCenter={TASHKENT_CENTER}
                initialZoom={12}
                onMapReady={handleMapReady}
              />
            </div>

            {/* Route Info Panel - Shows when route is displayed */}
            <AnimatePresence>
              {showingRoute && routeInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-16 left-4 right-4 z-10"
                >
                  <Card className="p-3 rounded-xl shadow-lg bg-background/95 backdrop-blur border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                            <Route className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{routeInfo.distance}</p>
                            <p className="text-xs text-muted-foreground">~{routeInfo.duration}</p>
                          </div>
                        </div>
                        
                        {/* Travel mode indicator */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs">
                          {travelMode === 'WALKING' ? (
                            <Footprints className="w-3 h-3" />
                          ) : (
                            <Car className="w-3 h-3" />
                          )}
                          <span>{travelMode === 'WALKING' ? 'Пешком' : 'На авто'}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          haptic.selection();
                          clearRoute();
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Location Card - Floating at bottom */}
            <AnimatePresence>
              {selectedLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  className="absolute bottom-4 left-4 right-4"
                >
                  <Card 
                    className={`p-4 rounded-2xl shadow-xl border-2 ${
                      selectedLocation.isAvailable 
                        ? 'border-espresso/30 bg-background' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        selectedLocation.isAvailable 
                          ? 'bg-gradient-to-br from-espresso to-espresso/80' 
                          : 'bg-muted'
                      }`}>
                        <Coffee className={`w-7 h-7 ${selectedLocation.isAvailable ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-foreground">{selectedLocation.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            selectedLocation.isAvailable 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedLocation.isAvailable ? 'Доступен' : 'Недоступен'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedLocation.locationName}</p>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedLocation.address}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-sm text-caramel font-medium">
                            <Navigation className="w-4 h-4" />
                            <span>{selectedLocation.distance} км</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-espresso font-medium">
                            <Clock className="w-4 h-4" />
                            <span>~{calculateWalkingTime(selectedLocation.distance || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Route Panel - Travel Mode & Actions */}
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {/* Travel Mode Selector */}
                      <div className="flex gap-2">
                        <Button
                          variant={travelMode === 'WALKING' ? 'default' : 'outline'}
                          size="sm"
                          className={cn("flex-1", travelMode === 'WALKING' && "bg-amber-600 hover:bg-amber-700")}
                          onClick={() => {
                            haptic.selection();
                            setTravelMode('WALKING');
                            // Recalculate route if already showing
                            if (showingRoute) {
                              calculateRoute({ lat: selectedLocation.lat, lng: selectedLocation.lng }, 'WALKING');
                            }
                          }}
                          disabled={isCalculatingRoute}
                        >
                          <Footprints className="w-4 h-4 mr-1" />
                          Пешком
                        </Button>
                        <Button
                          variant={travelMode === 'DRIVING' ? 'default' : 'outline'}
                          size="sm"
                          className={cn("flex-1", travelMode === 'DRIVING' && "bg-amber-600 hover:bg-amber-700")}
                          onClick={() => {
                            haptic.selection();
                            setTravelMode('DRIVING');
                            // Recalculate route if already showing
                            if (showingRoute) {
                              calculateRoute({ lat: selectedLocation.lat, lng: selectedLocation.lng }, 'DRIVING');
                            }
                          }}
                          disabled={isCalculatingRoute}
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
                      
                      {/* Route Info Display */}
                      {routeInfo && showingRoute && (
                        <div className="flex items-center gap-4 p-2 rounded-lg bg-secondary text-sm">
                          <div className="flex items-center gap-1">
                            <Navigation className="w-4 h-4 text-amber-600" />
                            <span className="font-medium">{routeInfo.distance}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">~{routeInfo.duration}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {!showingRoute ? (
                          <Button
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => {
                              haptic.impact('light');
                              calculateRoute({ lat: selectedLocation.lat, lng: selectedLocation.lng });
                            }}
                            disabled={isCalculatingRoute}
                          >
                            {isCalculatingRoute ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Построение...
                              </>
                            ) : (
                              <>
                                <Route className="w-4 h-4 mr-2" />
                                Показать маршрут
                              </>
                            )}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                haptic.selection();
                                clearRoute();
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Очистить
                            </Button>
                            <Button
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => {
                                haptic.impact('light');
                                setNavigationDestination({
                                  lat: selectedLocation.lat,
                                  lng: selectedLocation.lng,
                                  name: selectedLocation.name,
                                  address: selectedLocation.address || ''
                                });
                                setNavigatorDialogOpen(true);
                              }}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Навигатор
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {/* External Maps Links - Quick access when route is shown */}
                      {showingRoute && routeInfo && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => {
                              haptic.selection();
                              openInExternalMaps(
                                { lat: selectedLocation.lat, lng: selectedLocation.lng },
                                selectedLocation.name,
                                'google'
                              );
                            }}
                          >
                            Google Maps
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => {
                              haptic.selection();
                              openInExternalMaps(
                                { lat: selectedLocation.lat, lng: selectedLocation.lng },
                                selectedLocation.name,
                                'yandex'
                              );
                            }}
                          >
                            Яндекс Карты
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Select Machine Button */}
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        className={`w-full h-12 rounded-xl font-semibold ${
                          selectedLocation.isAvailable 
                            ? 'bg-espresso hover:bg-espresso/90 text-white' 
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        disabled={!selectedLocation.isAvailable}
                        onClick={() => handleSelectLocation(selectedLocation)}
                      >
                        {selectedLocation.isAvailable ? (
                          <>
                            {isOrderMode ? 'Заказать здесь' : 'Выбрать автомат'}
                            <ChevronRight className="w-5 h-5 ml-1" />
                          </>
                        ) : (
                          'Недоступен'
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick location chips at top */}
            <div className="absolute top-4 left-4 right-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {mockLocations.slice(0, 4).map((loc) => (
                  <Button
                    key={loc.id}
                    variant={selectedLocationId === loc.id ? 'default' : 'secondary'}
                    size="sm"
                    className={`rounded-full whitespace-nowrap shadow-md ${
                      selectedLocationId === loc.id 
                        ? 'bg-espresso text-white' 
                        : 'bg-background/95 backdrop-blur'
                    }`}
                    onClick={() => handleMarkerSelect(loc.id)}
                  >
                    <Coffee className="w-3.5 h-3.5 mr-1.5" />
                    {loc.name.split(' ')[0]}
                    <span className="ml-1 text-xs opacity-70">{loc.distance}км</span>
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* List View */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Nearest label */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Navigation className="w-4 h-4" />
                Ближайшие автоматы
              </p>
            </div>

            {/* Locations List */}
            <main className="px-4 space-y-3">
              {filteredLocations.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Ничего не найдено</p>
                </div>
              ) : (
                filteredLocations.map((location, index) => (
                  <motion.div
                    key={location.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card 
                      className={`coffee-card cursor-pointer transition-all ${
                        location.isAvailable 
                          ? 'hover:shadow-lg active:scale-[0.98]' 
                          : 'opacity-60'
                      } ${index === 0 && location.isAvailable ? 'ring-2 ring-espresso/30' : ''}`}
                      onClick={() => handleSelectLocation(location)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          location.isAvailable 
                            ? 'bg-gradient-to-br from-espresso to-espresso/80' 
                            : 'bg-muted'
                        }`}>
                          <Coffee className={`w-6 h-6 ${location.isAvailable ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground truncate">{location.name}</h3>
                                {index === 0 && location.isAvailable && (
                                  <span className="px-1.5 py-0.5 bg-espresso/10 text-espresso text-xs rounded font-medium">
                                    Ближайший
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{location.locationName}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{location.address}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            {/* Distance, Walking Time & Navigate */}
                            <div className="flex items-center gap-3">
                              {location.distance && (
                                <>
                                  <div className="flex items-center gap-1 text-sm text-caramel font-medium">
                                    <Navigation className="w-4 h-4" />
                                    <span>{location.distance} км</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-espresso font-medium">
                                    <Clock className="w-4 h-4" />
                                    <span>~{calculateWalkingTime(location.distance)}</span>
                                  </div>
                                </>
                              )}
                              <button
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  haptic.impact('light');
                                  setNavigationDestination({
                                    lat: location.lat,
                                    lng: location.lng,
                                    name: location.name,
                                    address: location.address || ''
                                  });
                                  setNavigatorDialogOpen(true);
                                }}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Маршрут
                              </button>
                            </div>
                            
                            {/* Status */}
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              location.isAvailable 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {location.isAvailable ? 'Доступен' : 'Недоступен'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigator Selection Dialog */}
      <NavigatorDialog
        open={navigatorDialogOpen}
        onOpenChange={setNavigatorDialogOpen}
        destination={navigationDestination}
      />
    </div>
  );
}
