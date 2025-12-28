import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// Telegram WebApp types
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text?: string }> }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isReady: boolean;
  isTelegram: boolean;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramWebApp['themeParams'] | null;
  onThemeChange: (callback: (colorScheme: 'light' | 'dark') => void) => () => void;
  haptic: {
    impact: (style?: 'light' | 'medium' | 'heavy') => void;
    notification: (type: 'success' | 'error' | 'warning') => void;
    selection: () => void;
  };
  updateHeaderColor: (color: string) => void;
  updateBackgroundColor: (color: string) => void;
}

const TelegramContext = createContext<TelegramContextType | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [themeChangeCallbacks] = useState<Set<(colorScheme: 'light' | 'dark') => void>>(new Set());

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      setWebApp(tg);
      setColorScheme(tg.colorScheme);
      
      // Set initial theme colors based on Telegram theme
      const bgColor = tg.colorScheme === 'dark' ? '#1a1a1a' : '#FDF8F3';
      tg.setHeaderColor(bgColor);
      tg.setBackgroundColor(bgColor);
      
      // Listen for theme changes from Telegram
      const handleThemeChange = () => {
        const newColorScheme = tg.colorScheme;
        setColorScheme(newColorScheme);
        
        // Update Telegram header/background colors
        const newBgColor = newColorScheme === 'dark' ? '#1a1a1a' : '#FDF8F3';
        tg.setHeaderColor(newBgColor);
        tg.setBackgroundColor(newBgColor);
        
        // Notify all registered callbacks
        themeChangeCallbacks.forEach(callback => callback(newColorScheme));
      };
      
      tg.onEvent('themeChanged', handleThemeChange);
      
      // Expand to full height
      tg.expand();
      
      // Signal ready
      tg.ready();
      setIsReady(true);
      
      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    } else {
      // Development mode without Telegram
      setIsReady(true);
    }
  }, [themeChangeCallbacks]);

  const user = webApp?.initDataUnsafe?.user || null;
  const isTelegram = !!webApp;
  const themeParams = webApp?.themeParams || null;

  // Register a callback for theme changes
  const onThemeChange = useCallback((callback: (colorScheme: 'light' | 'dark') => void) => {
    themeChangeCallbacks.add(callback);
    return () => {
      themeChangeCallbacks.delete(callback);
    };
  }, [themeChangeCallbacks]);

  // Update header color
  const updateHeaderColor = useCallback((color: string) => {
    webApp?.setHeaderColor(color);
  }, [webApp]);

  // Update background color
  const updateBackgroundColor = useCallback((color: string) => {
    webApp?.setBackgroundColor(color);
  }, [webApp]);

  const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy' = 'light') => {
      webApp?.HapticFeedback?.impactOccurred(style);
    },
    notification: (type: 'success' | 'error' | 'warning') => {
      webApp?.HapticFeedback?.notificationOccurred(type);
    },
    selection: () => {
      webApp?.HapticFeedback?.selectionChanged();
    },
  };

  return (
    <TelegramContext.Provider value={{ 
      webApp, 
      user, 
      isReady, 
      isTelegram, 
      colorScheme, 
      themeParams,
      onThemeChange,
      haptic,
      updateHeaderColor,
      updateBackgroundColor
    }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
}
