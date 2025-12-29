/**
 * useGeolocation Hook
 * Provides geolocation with localStorage caching for faster initial load
 */

import { useState, useEffect, useCallback } from 'react';

// Default coordinates for Tashkent (fallback)
const DEFAULT_LAT = 41.2995;
const DEFAULT_LNG = 69.2401;

// Cache configuration
const CACHE_KEY = 'vendhub_user_location';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface CachedLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

interface GeolocationState {
  location: { lat: number; lng: number } | null;
  isLoading: boolean;
  error: string | null;
  isFromCache: boolean;
  lastUpdated: Date | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  cacheExpiryMs?: number;
}

/**
 * Get cached location from localStorage
 */
function getCachedLocation(expiryMs: number): CachedLocation | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedLocation = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - parsed.timestamp > expiryMs) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save location to localStorage cache
 */
function setCachedLocation(lat: number, lng: number): void {
  try {
    const cached: CachedLocation = {
      lat,
      lng,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Custom hook for geolocation with caching
 */
export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationState & {
  refresh: () => void;
  clearCache: () => void;
} {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    cacheExpiryMs = CACHE_EXPIRY_MS
  } = options;

  const [state, setState] = useState<GeolocationState>(() => {
    // Try to load from cache immediately
    const cached = getCachedLocation(cacheExpiryMs);
    if (cached) {
      return {
        location: { lat: cached.lat, lng: cached.lng },
        isLoading: true, // Still loading fresh position
        error: null,
        isFromCache: true,
        lastUpdated: new Date(cached.timestamp)
      };
    }
    return {
      location: null,
      isLoading: true,
      error: null,
      isFromCache: false,
      lastUpdated: null
    };
  });

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        location: prev.location || { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
        isLoading: false,
        error: 'Geolocation not supported',
        isFromCache: prev.isFromCache
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Save to cache
        setCachedLocation(newLocation.lat, newLocation.lng);
        
        setState({
          location: newLocation,
          isLoading: false,
          error: null,
          isFromCache: false,
          lastUpdated: new Date()
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        
        // Use cached location or default
        const cached = getCachedLocation(cacheExpiryMs * 2); // Allow older cache on error
        const fallbackLocation = cached 
          ? { lat: cached.lat, lng: cached.lng }
          : { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
        
        setState(prev => ({
          location: prev.location || fallbackLocation,
          isLoading: false,
          error: error.message,
          isFromCache: !!cached || prev.isFromCache,
          lastUpdated: cached ? new Date(cached.timestamp) : prev.lastUpdated
        }));
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, cacheExpiryMs]);

  // Fetch location on mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const refresh = useCallback(() => {
    fetchLocation();
  }, [fetchLocation]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setState(prev => ({
        ...prev,
        isFromCache: false
      }));
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    ...state,
    refresh,
    clearCache
  };
}

export default useGeolocation;
