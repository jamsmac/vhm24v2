/**
 * VendHub TWA - Locations Page
 * Shows nearby vending machines with interactive map
 * Handles pending order flow - adds drink to cart after selection
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTelegram } from "@/contexts/TelegramContext";
import { useCartStore, Machine } from "@/stores/cartStore";
import { usePendingOrderStore } from "@/stores/pendingOrderStore";
import { MapView } from "@/components/Map";
import { ArrowLeft, Search, MapPin, Coffee, ChevronRight, Navigation, ShoppingBag, Map, List, ExternalLink } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Check if we're in order mode (coming from drink detail)
  const isOrderMode = searchParams.includes('order=true');

  const filteredLocations = mockLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                        <div className="flex items-center gap-1 mt-1 text-sm text-caramel font-medium">
                          <Navigation className="w-4 h-4" />
                          <span>{selectedLocation.distance} км от вас</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      {/* Navigate Button */}
                      <Button
                        variant="outline"
                        className="flex-1 h-12 rounded-xl font-semibold border-2 border-caramel text-caramel hover:bg-caramel/10"
                        onClick={() => {
                          haptic.impact('light');
                          // Open navigation in Google Maps or Yandex Maps
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}&travelmode=walking`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Navigation className="w-5 h-5 mr-2" />
                        Маршрут
                        <ExternalLink className="w-4 h-4 ml-1 opacity-60" />
                      </Button>
                      
                      {/* Select Button */}
                      <Button
                        className={`flex-1 h-12 rounded-xl font-semibold ${
                          selectedLocation.isAvailable 
                            ? 'bg-espresso hover:bg-espresso/90 text-white' 
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        disabled={!selectedLocation.isAvailable}
                        onClick={() => handleSelectLocation(selectedLocation)}
                      >
                        {selectedLocation.isAvailable ? (
                          <>
                            {isOrderMode ? 'Заказать' : 'Выбрать'}
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
                            {/* Distance & Navigate */}
                            <div className="flex items-center gap-3">
                              {location.distance && (
                                <div className="flex items-center gap-1 text-sm text-caramel font-medium">
                                  <Navigation className="w-4 h-4" />
                                  <span>{location.distance} км</span>
                                </div>
                              )}
                              <button
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  haptic.impact('light');
                                  const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=walking`;
                                  window.open(url, '_blank');
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
    </div>
  );
}
