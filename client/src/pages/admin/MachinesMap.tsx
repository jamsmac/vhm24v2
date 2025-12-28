import { useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { MachinesMap, Machine } from "@/components/MachinesMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  List, 
  Map as MapIcon,
  Wifi,
  WifiOff,
  Wrench,
  Coffee,
  ArrowRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function AdminMachinesMapPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  
  // Fetch machines from API
  const { data: machinesData, isLoading } = trpc.machines.list.useQuery();
  
  const machines: Machine[] = (machinesData || []).map((m: any) => ({
    id: m.id,
    machineCode: m.machineCode,
    name: m.name,
    address: m.address,
    latitude: m.latitude,
    longitude: m.longitude,
    status: m.status as 'online' | 'offline' | 'maintenance',
    imageUrl: m.imageUrl,
  }));

  const handleMachineSelect = (machine: Machine) => {
    setLocation(`/admin/machines?selected=${machine.id}`);
  };

  // Status counts
  const statusCounts = {
    total: machines.length,
    online: machines.filter(m => m.status === 'online').length,
    offline: machines.filter(m => m.status === 'offline').length,
    maintenance: machines.filter(m => m.status === 'maintenance').length,
  };

  const statusConfig = {
    online: { color: 'bg-green-500', icon: Wifi, label: 'Онлайн' },
    offline: { color: 'bg-red-500', icon: WifiOff, label: 'Офлайн' },
    maintenance: { color: 'bg-amber-500', icon: Wrench, label: 'ТО' },
  };

  return (
    <AdminLayout title="Карта автоматов">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapIcon className="w-7 h-7 text-amber-600" />
              Карта автоматов
            </h1>
            <p className="text-muted-foreground mt-1">
              Интерактивная карта всех вендинговых автоматов
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className={cn(
                  "rounded-none",
                  viewMode === 'map' && "bg-amber-600 hover:bg-amber-700"
                )}
              >
                <MapIcon className="w-4 h-4 mr-1" />
                Карта
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  "rounded-none",
                  viewMode === 'list' && "bg-amber-600 hover:bg-amber-700"
                )}
              >
                <List className="w-4 h-4 mr-1" />
                Список
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/admin/machines')}
            >
              Управление
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Coffee className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
                <p className="text-xs text-muted-foreground">Всего</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Wifi className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{statusCounts.online}</p>
                <p className="text-xs text-muted-foreground">Онлайн</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <WifiOff className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{statusCounts.offline}</p>
                <p className="text-xs text-muted-foreground">Офлайн</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{statusCounts.maintenance}</p>
                <p className="text-xs text-muted-foreground">На ТО</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map or List View */}
        {isLoading ? (
          <Card className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Загрузка карты...</p>
            </div>
          </Card>
        ) : viewMode === 'map' ? (
          <Card className="overflow-hidden">
            <MachinesMap
              machines={machines}
              className="h-[600px]"
              onMachineSelect={handleMachineSelect}
              showFilters={true}
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {machines.map(machine => {
              const config = statusConfig[machine.status];
              const StatusIcon = config.icon;
              
              return (
                <Card 
                  key={machine.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleMachineSelect(machine)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                          <Coffee className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{machine.name}</h3>
                          <p className="text-sm text-muted-foreground">{machine.machineCode}</p>
                        </div>
                      </div>
                      <Badge className={cn("text-white", config.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    {machine.address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {machine.address}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
