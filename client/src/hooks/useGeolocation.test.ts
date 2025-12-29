import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useGeolocation', () => {
  const mockPosition = {
    coords: {
      latitude: 41.3111,
      longitude: 69.2797,
      accuracy: 10,
    },
    timestamp: Date.now(),
  };

  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with loading state when no cache exists', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {});
    
    const { result } = renderHook(() => useGeolocation());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.location).toBe(null);
    expect(result.current.isFromCache).toBe(false);
  });

  it('should load cached location immediately', () => {
    const cachedLocation = {
      lat: 41.2995,
      lng: 69.2401,
      timestamp: Date.now() - 1000, // 1 second ago
    };
    localStorageMock.setItem('vendhub_user_location', JSON.stringify(cachedLocation));
    
    mockGeolocation.getCurrentPosition.mockImplementation(() => {});
    
    const { result } = renderHook(() => useGeolocation());
    
    expect(result.current.location).toEqual({
      lat: cachedLocation.lat,
      lng: cachedLocation.lng,
    });
    expect(result.current.isFromCache).toBe(true);
  });

  it('should update location when geolocation succeeds', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });
    
    const { result } = renderHook(() => useGeolocation());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.location).toEqual({
      lat: mockPosition.coords.latitude,
      lng: mockPosition.coords.longitude,
    });
    expect(result.current.error).toBe(null);
    expect(result.current.isFromCache).toBe(false);
  });

  it('should save location to cache after successful geolocation', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });
    
    renderHook(() => useGeolocation());
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
    
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData.lat).toBe(mockPosition.coords.latitude);
    expect(savedData.lng).toBe(mockPosition.coords.longitude);
  });

  it('should handle geolocation error and use fallback', async () => {
    const error = { code: 1, message: 'User denied geolocation' };
    mockGeolocation.getCurrentPosition.mockImplementation((_, errorCallback) => {
      errorCallback(error);
    });
    
    const { result } = renderHook(() => useGeolocation());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBe(error.message);
    // Should have fallback location (Tashkent)
    expect(result.current.location).toBeDefined();
    expect(result.current.location?.lat).toBe(41.2995);
    expect(result.current.location?.lng).toBe(69.2401);
  });

  it('should not use expired cache', () => {
    const expiredCache = {
      lat: 41.2995,
      lng: 69.2401,
      timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago (expired)
    };
    localStorageMock.setItem('vendhub_user_location', JSON.stringify(expiredCache));
    
    mockGeolocation.getCurrentPosition.mockImplementation(() => {});
    
    const { result } = renderHook(() => useGeolocation({
      cacheExpiryMs: 30 * 60 * 1000, // 30 minutes
    }));
    
    expect(result.current.location).toBe(null);
    expect(result.current.isFromCache).toBe(false);
  });

  it('should provide refresh function', async () => {
    let callCount = 0;
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      callCount++;
      success({
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 41.3 + callCount * 0.01,
        },
      });
    });
    
    const { result } = renderHook(() => useGeolocation());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const firstLat = result.current.location?.lat;
    
    act(() => {
      result.current.refresh();
    });
    
    await waitFor(() => {
      expect(result.current.location?.lat).not.toBe(firstLat);
    });
  });

  it('should provide clearCache function', () => {
    const cachedLocation = {
      lat: 41.2995,
      lng: 69.2401,
      timestamp: Date.now(),
    };
    localStorageMock.setItem('vendhub_user_location', JSON.stringify(cachedLocation));
    
    mockGeolocation.getCurrentPosition.mockImplementation(() => {});
    
    const { result } = renderHook(() => useGeolocation());
    
    expect(result.current.isFromCache).toBe(true);
    
    act(() => {
      result.current.clearCache();
    });
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('vendhub_user_location');
    expect(result.current.isFromCache).toBe(false);
  });

  it('should handle missing geolocation API', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });
    
    const { result } = renderHook(() => useGeolocation());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBe('Geolocation not supported');
    // Should have fallback location
    expect(result.current.location).toBeDefined();
  });
});
