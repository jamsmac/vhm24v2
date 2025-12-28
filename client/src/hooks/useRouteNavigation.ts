import { useState, useCallback, useRef } from 'react';

export interface RouteInfo {
  distance: string;
  duration: string;
  distanceValue: number; // meters
  durationValue: number; // seconds
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type TravelMode = 'WALKING' | 'DRIVING' | 'TRANSIT';

interface UseRouteNavigationOptions {
  map?: google.maps.Map | null;
  onRouteCalculated?: (route: RouteInfo) => void;
  onError?: (error: string) => void;
}

export function useRouteNavigation(options: UseRouteNavigationOptions = {}) {
  const { map, onRouteCalculated, onError } = options;
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('WALKING');
  
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Initialize directions service and renderer
  const initDirections = useCallback(() => {
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
    
    if (!directionsRendererRef.current && map) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#D97706', // amber-600
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
        markerOptions: {
          // Custom marker styling handled separately
        },
      });
    }
    
    return { 
      service: directionsServiceRef.current, 
      renderer: directionsRendererRef.current 
    };
  }, [map]);

  // Calculate route between two points
  const calculateRoute = useCallback(async (
    origin: Coordinates | 'current',
    destination: Coordinates,
    mode: TravelMode = travelMode
  ): Promise<RouteInfo | null> => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const { service, renderer } = initDirections();
      
      if (!service) {
        throw new Error('Directions service not available');
      }

      let originLatLng: google.maps.LatLngLiteral;
      
      if (origin === 'current') {
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
        originLatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } else {
        originLatLng = origin;
      }

      const request: google.maps.DirectionsRequest = {
        origin: originLatLng,
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
            reject(new Error(getDirectionsErrorMessage(status)));
          }
        });
      });

      // Display route on map
      if (renderer && map) {
        renderer.setMap(map);
        renderer.setDirections(result);
      }

      // Extract route info
      const route = result.routes[0];
      const leg = route.legs[0];
      
      const routeData: RouteInfo = {
        distance: leg.distance?.text || '',
        duration: leg.duration?.text || '',
        distanceValue: leg.distance?.value || 0,
        durationValue: leg.duration?.value || 0,
        steps: leg.steps.map(step => ({
          instruction: step.instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          distance: step.distance?.text || '',
          duration: step.duration?.text || '',
        })),
      };

      setRouteInfo(routeData);
      setTravelMode(mode);
      onRouteCalculated?.(routeData);
      
      return routeData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка построения маршрута';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [map, travelMode, initDirections, onRouteCalculated, onError]);

  // Clear route from map
  const clearRoute = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
    setRouteInfo(null);
    setError(null);
  }, []);

  // Open route in external maps app
  const openInExternalMaps = useCallback((
    destination: Coordinates,
    destinationName: string,
    app: 'google' | 'yandex' | 'apple' = 'google'
  ) => {
    const { lat, lng } = destination;
    let url: string;

    switch (app) {
      case 'google':
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(destinationName)}&travelmode=${travelMode.toLowerCase()}`;
        break;
      case 'yandex':
        url = `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=${travelMode === 'DRIVING' ? 'auto' : 'pd'}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=${travelMode === 'DRIVING' ? 'd' : 'w'}`;
        break;
      default:
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }

    window.open(url, '_blank');
  }, [travelMode]);

  // Get user's current location
  const getCurrentLocation = useCallback(async (): Promise<Coordinates | null> => {
    try {
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
      
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch {
      return null;
    }
  }, []);

  return {
    isCalculating,
    routeInfo,
    error,
    travelMode,
    setTravelMode,
    calculateRoute,
    clearRoute,
    openInExternalMaps,
    getCurrentLocation,
  };
}

// Helper function to get user-friendly error messages
function getDirectionsErrorMessage(status: google.maps.DirectionsStatus): string {
  switch (status) {
    case google.maps.DirectionsStatus.NOT_FOUND:
      return 'Не удалось найти маршрут до указанной точки';
    case google.maps.DirectionsStatus.ZERO_RESULTS:
      return 'Маршрут не найден. Попробуйте другой способ передвижения';
    case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
      return 'Превышено максимальное количество точек маршрута';
    case google.maps.DirectionsStatus.INVALID_REQUEST:
      return 'Неверный запрос маршрута';
    case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
      return 'Превышен лимит запросов. Попробуйте позже';
    case google.maps.DirectionsStatus.REQUEST_DENIED:
      return 'Запрос отклонён';
    case google.maps.DirectionsStatus.UNKNOWN_ERROR:
    default:
      return 'Произошла ошибка при построении маршрута';
  }
}

export default useRouteNavigation;
