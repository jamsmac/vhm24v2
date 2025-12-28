/**
 * useLocationTracking Hook
 * 
 * Provides real-time GPS location tracking using the Geolocation API.
 * Tracks user position and calculates proximity to route steps for
 * automatic navigation step highlighting.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface LocationTrackingState {
  isSupported: boolean;
  isTracking: boolean;
  isPermissionGranted: boolean;
  currentLocation: LocationCoords | null;
  error: string | null;
  currentStepIndex: number;
}

export interface LocationTrackingActions {
  startTracking: () => void;
  stopTracking: () => void;
  toggle: () => void;
  requestPermission: () => Promise<boolean>;
  setRouteSteps: (steps: RouteStepLocation[]) => void;
  clearRoute: () => void;
}

export interface RouteStepLocation {
  lat: number;
  lng: number;
  instruction: string;
}

interface UseLocationTrackingOptions {
  /** Distance threshold in meters to consider step as "reached" */
  stepProximityThreshold?: number;
  /** How often to update location in milliseconds */
  updateInterval?: number;
  /** Enable high accuracy GPS (uses more battery) */
  highAccuracy?: boolean;
  /** Callback when step changes */
  onStepChange?: (stepIndex: number, step: RouteStepLocation | null) => void;
  /** Callback when approaching next step */
  onApproachingStep?: (stepIndex: number, distance: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<UseLocationTrackingOptions, 'onStepChange' | 'onApproachingStep'>> = {
  stepProximityThreshold: 30, // 30 meters
  updateInterval: 3000, // 3 seconds
  highAccuracy: true,
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function useLocationTracking(
  options: UseLocationTrackingOptions = {}
): [LocationTrackingState, LocationTrackingActions] {
  const {
    stepProximityThreshold = DEFAULT_OPTIONS.stepProximityThreshold,
    updateInterval = DEFAULT_OPTIONS.updateInterval,
    highAccuracy = DEFAULT_OPTIONS.highAccuracy,
    onStepChange,
    onApproachingStep,
  } = options;

  // State
  const [isSupported, setIsSupported] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // Refs
  const watchIdRef = useRef<number | null>(null);
  const routeStepsRef = useRef<RouteStepLocation[]>([]);
  const lastStepIndexRef = useRef(-1);
  const approachingAnnouncedRef = useRef<Set<number>>(new Set());

  // Check if Geolocation API is supported
  useEffect(() => {
    if (!navigator.geolocation) {
      setIsSupported(false);
      setError('Геолокация не поддерживается в этом браузере');
    }
  }, []);

  // Find current step based on location
  const findCurrentStep = useCallback(
    (location: LocationCoords) => {
      const steps = routeStepsRef.current;
      if (steps.length === 0) return -1;

      // Find the closest step that hasn't been passed yet
      let closestIndex = -1;
      let closestDistance = Infinity;

      for (let i = lastStepIndexRef.current === -1 ? 0 : lastStepIndexRef.current; i < steps.length; i++) {
        const step = steps[i];
        const distance = calculateDistance(
          location.lat,
          location.lng,
          step.lat,
          step.lng
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }

        // If we're within threshold of this step, we've reached it
        if (distance <= stepProximityThreshold) {
          return i;
        }
      }

      // Check if approaching next step (within 100m)
      const nextStepIndex = lastStepIndexRef.current + 1;
      if (nextStepIndex < steps.length && nextStepIndex >= 0) {
        const nextStep = steps[nextStepIndex];
        const distanceToNext = calculateDistance(
          location.lat,
          location.lng,
          nextStep.lat,
          nextStep.lng
        );

        // Announce when within 100m and haven't announced yet
        if (distanceToNext <= 100 && !approachingAnnouncedRef.current.has(nextStepIndex)) {
          approachingAnnouncedRef.current.add(nextStepIndex);
          onApproachingStep?.(nextStepIndex, distanceToNext);
        }
      }

      return closestIndex;
    },
    [stepProximityThreshold, onApproachingStep]
  );

  // Handle position update
  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition) => {
      const newLocation: LocationCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      setCurrentLocation(newLocation);
      setError(null);

      // Find and update current step
      if (routeStepsRef.current.length > 0) {
        const stepIndex = findCurrentStep(newLocation);
        
        if (stepIndex !== lastStepIndexRef.current && stepIndex >= lastStepIndexRef.current) {
          lastStepIndexRef.current = stepIndex;
          setCurrentStepIndex(stepIndex);
          onStepChange?.(stepIndex, routeStepsRef.current[stepIndex] || null);
        }
      }
    },
    [findCurrentStep, onStepChange]
  );

  // Handle position error
  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'Ошибка определения местоположения';
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Доступ к геолокации запрещён';
        setIsPermissionGranted(false);
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Местоположение недоступно';
        break;
      case err.TIMEOUT:
        errorMessage = 'Превышено время ожидания';
        break;
    }
    
    setError(errorMessage);
  }, []);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    setIsTracking(true);
    setError(null);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePositionUpdate(position);
        setIsPermissionGranted(true);
      },
      handlePositionError,
      {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: highAccuracy,
        timeout: 30000,
        maximumAge: updateInterval,
      }
    );
  }, [highAccuracy, updateInterval, handlePositionUpdate, handlePositionError]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Toggle tracking
  const toggle = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) return false;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsPermissionGranted(true);
          setError(null);
          resolve(true);
        },
        (err) => {
          handlePositionError(err);
          resolve(false);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [highAccuracy, handlePositionError]);

  // Set route steps for tracking
  const setRouteSteps = useCallback((steps: RouteStepLocation[]) => {
    routeStepsRef.current = steps;
    lastStepIndexRef.current = -1;
    approachingAnnouncedRef.current.clear();
    setCurrentStepIndex(-1);
  }, []);

  // Clear route
  const clearRoute = useCallback(() => {
    routeStepsRef.current = [];
    lastStepIndexRef.current = -1;
    approachingAnnouncedRef.current.clear();
    setCurrentStepIndex(-1);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const state: LocationTrackingState = {
    isSupported,
    isTracking,
    isPermissionGranted,
    currentLocation,
    error,
    currentStepIndex,
  };

  const actions: LocationTrackingActions = {
    startTracking,
    stopTracking,
    toggle,
    requestPermission,
    setRouteSteps,
    clearRoute,
  };

  return [state, actions];
}

// Export distance calculation for use elsewhere
export { calculateDistance };
