/**
 * Tests for useLocationTracking hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocationTracking, calculateDistance } from './useLocationTracking';

// Mock Geolocation API
const mockGetCurrentPosition = vi.fn();
const mockWatchPosition = vi.fn();
const mockClearWatch = vi.fn();

const mockGeolocation = {
  getCurrentPosition: mockGetCurrentPosition,
  watchPosition: mockWatchPosition,
  clearWatch: mockClearWatch,
};

describe('useLocationTracking', () => {
  beforeEach(() => {
    // Setup global mocks
    vi.stubGlobal('navigator', {
      geolocation: mockGeolocation,
    });
    
    // Reset mocks
    mockGetCurrentPosition.mockClear();
    mockWatchPosition.mockClear();
    mockClearWatch.mockClear();
    
    // Default mock implementation
    mockWatchPosition.mockReturnValue(1); // Return watch ID
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should detect Geolocation API support', () => {
      const { result } = renderHook(() => useLocationTracking());
      const [state] = result.current;
      
      expect(state.isSupported).toBe(true);
    });

    it('should start with tracking disabled', () => {
      const { result } = renderHook(() => useLocationTracking());
      const [state] = result.current;
      
      expect(state.isTracking).toBe(false);
      expect(state.currentLocation).toBeNull();
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useLocationTracking());
      const [state] = result.current;
      
      expect(state.error).toBeNull();
    });

    it('should set currentStepIndex to -1 initially', () => {
      const { result } = renderHook(() => useLocationTracking());
      const [state] = result.current;
      
      expect(state.currentStepIndex).toBe(-1);
    });
  });

  describe('startTracking', () => {
    it('should start tracking when called', () => {
      mockGetCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 41.2995,
            longitude: 69.2401,
            accuracy: 10,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      act(() => {
        result.current[1].startTracking();
      });
      
      expect(result.current[0].isTracking).toBe(true);
      expect(mockGetCurrentPosition).toHaveBeenCalled();
      expect(mockWatchPosition).toHaveBeenCalled();
    });

    it('should update currentLocation on position update', () => {
      mockGetCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 41.2995,
            longitude: 69.2401,
            accuracy: 10,
            heading: 45,
            speed: 1.5,
          },
          timestamp: 1234567890,
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      act(() => {
        result.current[1].startTracking();
      });
      
      expect(result.current[0].currentLocation).toEqual({
        lat: 41.2995,
        lng: 69.2401,
        accuracy: 10,
        heading: 45,
        speed: 1.5,
        timestamp: 1234567890,
      });
    });

    it('should set isPermissionGranted to true on success', () => {
      mockGetCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 41.2995,
            longitude: 69.2401,
            accuracy: 10,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      act(() => {
        result.current[1].startTracking();
      });
      
      expect(result.current[0].isPermissionGranted).toBe(true);
    });
  });

  describe('stopTracking', () => {
    it('should stop tracking when called', () => {
      mockGetCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 41.2995,
            longitude: 69.2401,
            accuracy: 10,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      act(() => {
        result.current[1].startTracking();
      });
      
      expect(result.current[0].isTracking).toBe(true);
      
      act(() => {
        result.current[1].stopTracking();
      });
      
      expect(result.current[0].isTracking).toBe(false);
      expect(mockClearWatch).toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('should toggle tracking on and off', () => {
      mockGetCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 41.2995,
            longitude: 69.2401,
            accuracy: 10,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      // Toggle on
      act(() => {
        result.current[1].toggle();
      });
      expect(result.current[0].isTracking).toBe(true);
      
      // Toggle off
      act(() => {
        result.current[1].toggle();
      });
      expect(result.current[0].isTracking).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle permission denied error', () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied geolocation',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      act(() => {
        result.current[1].startTracking();
      });
      
      expect(result.current[0].error).toBe('Доступ к геолокации запрещён');
      expect(result.current[0].isPermissionGranted).toBe(false);
    });

    it('should handle position unavailable error', () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error({
          code: 2, // POSITION_UNAVAILABLE
          message: 'Position unavailable',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      act(() => {
        result.current[1].startTracking();
      });
      
      expect(result.current[0].error).toBe('Местоположение недоступно');
    });

    it('should handle timeout error', () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error({
          code: 3, // TIMEOUT
          message: 'Timeout',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      act(() => {
        result.current[1].startTracking();
      });
      
      expect(result.current[0].error).toBe('Превышено время ожидания');
    });
  });

  describe('route steps', () => {
    it('should set route steps', () => {
      const { result } = renderHook(() => useLocationTracking());
      
      const steps = [
        { lat: 41.2995, lng: 69.2401, instruction: 'Go straight' },
        { lat: 41.3000, lng: 69.2410, instruction: 'Turn right' },
      ];
      
      act(() => {
        result.current[1].setRouteSteps(steps);
      });
      
      // Steps are stored internally, currentStepIndex should be -1
      expect(result.current[0].currentStepIndex).toBe(-1);
    });

    it('should clear route steps', () => {
      const { result } = renderHook(() => useLocationTracking());
      
      const steps = [
        { lat: 41.2995, lng: 69.2401, instruction: 'Go straight' },
      ];
      
      act(() => {
        result.current[1].setRouteSteps(steps);
      });
      
      act(() => {
        result.current[1].clearRoute();
      });
      
      expect(result.current[0].currentStepIndex).toBe(-1);
    });
  });

  describe('requestPermission', () => {
    it('should return true when permission granted', async () => {
      mockGetCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 41.2995,
            longitude: 69.2401,
            accuracy: 10,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      let permissionResult: boolean = false;
      await act(async () => {
        permissionResult = await result.current[1].requestPermission();
      });
      
      expect(permissionResult).toBe(true);
      expect(result.current[0].isPermissionGranted).toBe(true);
    });

    it('should return false when permission denied', async () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error({
          code: 1,
          message: 'User denied geolocation',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      const { result } = renderHook(() => useLocationTracking());
      
      let permissionResult: boolean = true;
      await act(async () => {
        permissionResult = await result.current[1].requestPermission();
      });
      
      expect(permissionResult).toBe(false);
    });
  });

  describe('unsupported browser', () => {
    it('should set isSupported to false when Geolocation API is not available', () => {
      vi.stubGlobal('navigator', {});
      
      const { result } = renderHook(() => useLocationTracking());
      const [state] = result.current;
      
      expect(state.isSupported).toBe(false);
      expect(state.error).toBe('Геолокация не поддерживается в этом браузере');
    });
  });
});

describe('calculateDistance', () => {
  it('should calculate distance between two points correctly', () => {
    // Tashkent coordinates
    const lat1 = 41.2995;
    const lng1 = 69.2401;
    
    // Point approximately 1km away
    const lat2 = 41.3085;
    const lng2 = 69.2401;
    
    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    
    // Should be approximately 1000 meters (allow some tolerance)
    expect(distance).toBeGreaterThan(900);
    expect(distance).toBeLessThan(1100);
  });

  it('should return 0 for same coordinates', () => {
    const lat = 41.2995;
    const lng = 69.2401;
    
    const distance = calculateDistance(lat, lng, lat, lng);
    
    expect(distance).toBe(0);
  });

  it('should calculate short distances accurately', () => {
    // Two points about 30 meters apart
    const lat1 = 41.2995;
    const lng1 = 69.2401;
    const lat2 = 41.2998;
    const lng2 = 69.2401;
    
    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    
    // Should be approximately 30-35 meters
    expect(distance).toBeGreaterThan(25);
    expect(distance).toBeLessThan(40);
  });
});
