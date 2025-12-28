/**
 * VendHub TWA - Locations Page
 * Shows nearby vending machines, sorted by distance
 * Handles pending order flow - adds drink to cart after selection
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTelegram } from "@/contexts/TelegramContext";
import { useCartStore, Machine } from "@/stores/cartStore";
import { usePendingOrderStore } from "@/stores/pendingOrderStore";
import { ArrowLeft, Search, MapPin, Coffee, ChevronRight, Navigation, ShoppingBag } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Mock locations data - sorted by distance
const mockLocations: Array<Machine & { distance?: number; machineCount: number }> = [
  {
    id: "1",
    machineNumber: "M-001",
    name: "KIUT Корпус А",
    locationName: "KIUT University",
    address: "ул. Лабзак, 12",
    isAvailable: true,
    distance: 0.3,
    machineCount: 2,
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
  },
];

export default function Locations() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const { haptic } = useTelegram();
  const { setMachine, addItem } = useCartStore();
  const { pendingDrink, clearPendingDrink } = usePendingOrderStore();
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={isOrderMode && pendingDrink ? `/drink/${pendingDrink.id}` : "/"}>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => haptic.selection()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold">
              {isOrderMode ? 'Выберите автомат' : 'Выбрать автомат'}
            </h1>
            {isOrderMode && pendingDrink && (
              <p className="text-sm text-muted-foreground">
                для заказа: {pendingDrink.name}
              </p>
            )}
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
                      {/* Distance */}
                      {location.distance && (
                        <div className="flex items-center gap-1 text-sm text-caramel font-medium">
                          <Navigation className="w-4 h-4" />
                          <span>{location.distance} км</span>
                        </div>
                      )}
                      
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
    </div>
  );
}
