/**
 * Voice Navigation Hook
 * Uses Web Speech API to read out turn-by-turn directions
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface VoiceNavigationOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface VoiceNavigationState {
  isSupported: boolean;
  isEnabled: boolean;
  isSpeaking: boolean;
  currentStepIndex: number;
  error: string | null;
}

export interface VoiceNavigationActions {
  enable: () => void;
  disable: () => void;
  toggle: () => void;
  speakStep: (text: string, stepIndex?: number) => void;
  speakAllSteps: (steps: string[]) => void;
  stop: () => void;
  announceArrival: (destinationName: string) => void;
  announceRouteStart: (distance: string, duration: string) => void;
}

const DEFAULT_OPTIONS: VoiceNavigationOptions = {
  language: 'ru-RU',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

export function useVoiceNavigation(
  options: VoiceNavigationOptions = {}
): [VoiceNavigationState, VoiceNavigationActions] {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stepsQueueRef = useRef<string[]>([]);
  const currentQueueIndexRef = useRef(0);

  // Check for Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      setIsSupported(true);
      
      // Pre-load voices
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        // Find Russian voice if available
        const russianVoice = voices.find(v => v.lang.startsWith('ru'));
        if (russianVoice) {
          console.log('Russian voice found:', russianVoice.name);
        }
      };
      
      loadVoices();
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    } else {
      setIsSupported(false);
      setError('Голосовая навигация не поддерживается в этом браузере');
    }
    
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Create utterance with options
  const createUtterance = useCallback((text: string): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = mergedOptions.language || 'ru-RU';
    utterance.rate = mergedOptions.rate || 1.0;
    utterance.pitch = mergedOptions.pitch || 1.0;
    utterance.volume = mergedOptions.volume || 1.0;
    
    // Try to find a Russian voice
    const voices = synthRef.current?.getVoices() || [];
    const russianVoice = voices.find(v => v.lang.startsWith('ru'));
    if (russianVoice) {
      utterance.voice = russianVoice;
    }
    
    return utterance;
  }, [mergedOptions]);

  // Speak a single step
  const speakStep = useCallback((text: string, stepIndex?: number) => {
    if (!isSupported || !isEnabled || !synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = createUtterance(text);
    utteranceRef.current = utterance;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      if (stepIndex !== undefined) {
        setCurrentStepIndex(stepIndex);
      }
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      if (event.error !== 'canceled') {
        setError(`Ошибка голосовой навигации: ${event.error}`);
      }
    };
    
    synthRef.current.speak(utterance);
  }, [isSupported, isEnabled, createUtterance]);

  // Speak all steps sequentially
  const speakAllSteps = useCallback((steps: string[]) => {
    if (!isSupported || !isEnabled || !synthRef.current || steps.length === 0) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    stepsQueueRef.current = steps;
    currentQueueIndexRef.current = 0;
    
    const speakNext = () => {
      if (currentQueueIndexRef.current >= stepsQueueRef.current.length) {
        setIsSpeaking(false);
        setCurrentStepIndex(-1);
        return;
      }
      
      const text = stepsQueueRef.current[currentQueueIndexRef.current];
      const utterance = createUtterance(text);
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentStepIndex(currentQueueIndexRef.current);
      };
      
      utterance.onend = () => {
        currentQueueIndexRef.current++;
        // Small delay between steps
        setTimeout(speakNext, 500);
      };
      
      utterance.onerror = (event) => {
        if (event.error !== 'canceled') {
          setError(`Ошибка: ${event.error}`);
        }
        setIsSpeaking(false);
      };
      
      synthRef.current?.speak(utterance);
    };
    
    speakNext();
  }, [isSupported, isEnabled, createUtterance]);

  // Stop speaking
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      stepsQueueRef.current = [];
      currentQueueIndexRef.current = 0;
      setIsSpeaking(false);
      setCurrentStepIndex(-1);
    }
  }, []);

  // Enable voice navigation
  const enable = useCallback(() => {
    if (isSupported) {
      setIsEnabled(true);
      setError(null);
    }
  }, [isSupported]);

  // Disable voice navigation
  const disable = useCallback(() => {
    stop();
    setIsEnabled(false);
  }, [stop]);

  // Toggle voice navigation
  const toggle = useCallback(() => {
    if (isEnabled) {
      disable();
    } else {
      enable();
    }
  }, [isEnabled, enable, disable]);

  // Announce arrival at destination
  const announceArrival = useCallback((destinationName: string) => {
    if (!isSupported || !isEnabled) return;
    
    const text = `Вы прибыли к месту назначения: ${destinationName}`;
    speakStep(text);
  }, [isSupported, isEnabled, speakStep]);

  // Announce route start
  const announceRouteStart = useCallback((distance: string, duration: string) => {
    if (!isSupported || !isEnabled) return;
    
    const text = `Маршрут построен. Расстояние: ${distance}. Время в пути: примерно ${duration}.`;
    speakStep(text);
  }, [isSupported, isEnabled, speakStep]);

  const state: VoiceNavigationState = {
    isSupported,
    isEnabled,
    isSpeaking,
    currentStepIndex,
    error,
  };

  const actions: VoiceNavigationActions = {
    enable,
    disable,
    toggle,
    speakStep,
    speakAllSteps,
    stop,
    announceArrival,
    announceRouteStart,
  };

  return [state, actions];
}
