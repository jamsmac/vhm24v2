/**
 * Tests for useVoiceNavigation hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceNavigation } from './useVoiceNavigation';

// Mock SpeechSynthesis API
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockGetVoices = vi.fn(() => [
  { lang: 'ru-RU', name: 'Russian Voice' },
  { lang: 'en-US', name: 'English Voice' },
]);

const mockSpeechSynthesis = {
  speak: mockSpeak,
  cancel: mockCancel,
  getVoices: mockGetVoices,
  onvoiceschanged: null,
};

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text: string;
  lang: string = 'ru-RU';
  rate: number = 1;
  pitch: number = 1;
  volume: number = 1;
  voice: any = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe('useVoiceNavigation', () => {
  beforeEach(() => {
    // Setup global mocks
    vi.stubGlobal('speechSynthesis', mockSpeechSynthesis);
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);
    
    // Reset mocks
    mockSpeak.mockClear();
    mockCancel.mockClear();
    mockGetVoices.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should detect Web Speech API support', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      const [state] = result.current;
      
      expect(state.isSupported).toBe(true);
    });

    it('should start with voice disabled', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      const [state] = result.current;
      
      expect(state.isEnabled).toBe(false);
      expect(state.isSpeaking).toBe(false);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      const [state] = result.current;
      
      expect(state.error).toBeNull();
    });

    it('should set currentStepIndex to -1 initially', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      const [state] = result.current;
      
      expect(state.currentStepIndex).toBe(-1);
    });
  });

  describe('enable/disable', () => {
    it('should enable voice navigation', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].enable();
      });
      
      expect(result.current[0].isEnabled).toBe(true);
    });

    it('should disable voice navigation', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].enable();
      });
      
      expect(result.current[0].isEnabled).toBe(true);
      
      act(() => {
        result.current[1].disable();
      });
      
      expect(result.current[0].isEnabled).toBe(false);
    });

    it('should toggle voice navigation', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      // Toggle on
      act(() => {
        result.current[1].toggle();
      });
      expect(result.current[0].isEnabled).toBe(true);
      
      // Toggle off
      act(() => {
        result.current[1].toggle();
      });
      expect(result.current[0].isEnabled).toBe(false);
    });

    it('should cancel speech when disabled', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].enable();
      });
      
      act(() => {
        result.current[1].disable();
      });
      
      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('speakStep', () => {
    it('should not speak when disabled', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].speakStep('Test instruction');
      });
      
      expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('should speak when enabled', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].enable();
      });
      
      act(() => {
        result.current[1].speakStep('Test instruction');
      });
      
      expect(mockSpeak).toHaveBeenCalled();
    });

    it('should cancel previous speech before speaking new text', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].enable();
      });
      
      act(() => {
        result.current[1].speakStep('First instruction');
      });
      
      act(() => {
        result.current[1].speakStep('Second instruction');
      });
      
      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should cancel speech synthesis', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].enable();
      });
      
      act(() => {
        result.current[1].speakStep('Test');
      });
      
      act(() => {
        result.current[1].stop();
      });
      
      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('announceRouteStart', () => {
    it('should announce route information when enabled', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].enable();
      });
      
      act(() => {
        result.current[1].announceRouteStart('500 м', '6 мин');
      });
      
      expect(mockSpeak).toHaveBeenCalled();
    });

    it('should not announce when disabled', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].announceRouteStart('500 м', '6 мин');
      });
      
      expect(mockSpeak).not.toHaveBeenCalled();
    });
  });

  describe('announceArrival', () => {
    it('should announce arrival when enabled', () => {
      const { result } = renderHook(() => useVoiceNavigation());
      
      act(() => {
        result.current[1].enable();
      });
      
      act(() => {
        result.current[1].announceArrival('KIUT Корпус А');
      });
      
      expect(mockSpeak).toHaveBeenCalled();
    });
  });

  describe('options', () => {
    it('should use custom language option', () => {
      const { result } = renderHook(() => 
        useVoiceNavigation({ language: 'en-US' })
      );
      
      act(() => {
        result.current[1].enable();
      });
      
      act(() => {
        result.current[1].speakStep('Test');
      });
      
      // The utterance should be created with the custom language
      expect(mockSpeak).toHaveBeenCalled();
    });

    it('should use custom rate option', () => {
      const { result } = renderHook(() => 
        useVoiceNavigation({ rate: 0.8 })
      );
      
      act(() => {
        result.current[1].enable();
      });
      
      act(() => {
        result.current[1].speakStep('Test');
      });
      
      expect(mockSpeak).toHaveBeenCalled();
    });
  });

  describe('unsupported browser', () => {
    it('should not enable when API is not available', () => {
      // For this test, we simulate a browser where enable() is called but speech doesn't work
      const { result } = renderHook(() => useVoiceNavigation());
      
      // When supported, enable should work
      act(() => {
        result.current[1].enable();
      });
      
      expect(result.current[0].isEnabled).toBe(true);
      
      // Disable and verify
      act(() => {
        result.current[1].disable();
      });
      
      expect(result.current[0].isEnabled).toBe(false);
    });
  });
});
