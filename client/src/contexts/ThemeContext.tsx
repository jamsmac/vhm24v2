import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
type ThemeMode = "light" | "dark" | "auto" | "telegram";

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme?: () => void;
  switchable: boolean;
  isTransitioning: boolean;
  isTelegramAvailable: boolean;
  telegramThemeParams: TelegramThemeParams | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

// Get system preferred theme
function getSystemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

// Get Telegram theme
function getTelegramTheme(): Theme | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.colorScheme;
  }
  return null;
}

// Get Telegram themeParams
function getTelegramThemeParams(): TelegramThemeParams | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.themeParams) {
    return window.Telegram.WebApp.themeParams;
  }
  return null;
}

// Check if running in Telegram
function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp;
}

// Convert hex color to OKLCH (approximate conversion for CSS)
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Apply Telegram theme params as CSS variables
function applyTelegramThemeParams(params: TelegramThemeParams | null) {
  if (!params) return;
  
  const root = document.documentElement;
  
  // Map Telegram themeParams to CSS custom properties
  if (params.bg_color) {
    root.style.setProperty('--tg-bg-color', params.bg_color);
  }
  if (params.text_color) {
    root.style.setProperty('--tg-text-color', params.text_color);
  }
  if (params.hint_color) {
    root.style.setProperty('--tg-hint-color', params.hint_color);
  }
  if (params.link_color) {
    root.style.setProperty('--tg-link-color', params.link_color);
  }
  if (params.button_color) {
    root.style.setProperty('--tg-button-color', params.button_color);
  }
  if (params.button_text_color) {
    root.style.setProperty('--tg-button-text-color', params.button_text_color);
  }
  if (params.secondary_bg_color) {
    root.style.setProperty('--tg-secondary-bg-color', params.secondary_bg_color);
  }
}

// Remove Telegram theme CSS variables
function removeTelegramThemeParams() {
  const root = document.documentElement;
  root.style.removeProperty('--tg-bg-color');
  root.style.removeProperty('--tg-text-color');
  root.style.removeProperty('--tg-hint-color');
  root.style.removeProperty('--tg-link-color');
  root.style.removeProperty('--tg-button-color');
  root.style.removeProperty('--tg-button-text-color');
  root.style.removeProperty('--tg-secondary-bg-color');
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const isTelegramAvailable = isTelegramWebApp();
  
  // Theme mode: light, dark, auto (system), or telegram
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (switchable) {
      const stored = localStorage.getItem("themeMode");
      if (stored === "light" || stored === "dark" || stored === "auto" || stored === "telegram") {
        return stored;
      }
      // Migration: check for old "theme" key
      const oldTheme = localStorage.getItem("theme");
      if (oldTheme === "light" || oldTheme === "dark") {
        return oldTheme;
      }
    }
    // Default to telegram mode if running in Telegram, otherwise use defaultTheme
    return isTelegramAvailable ? "telegram" : defaultTheme;
  });

  // Actual theme being applied (resolved from mode)
  const [theme, setTheme] = useState<Theme>(() => {
    if (themeMode === "telegram") {
      return getTelegramTheme() || getSystemTheme();
    }
    if (themeMode === "auto") {
      return getSystemTheme();
    }
    return themeMode as Theme;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [telegramThemeParams, setTelegramThemeParams] = useState<TelegramThemeParams | null>(
    getTelegramThemeParams()
  );

  // Listen for Telegram theme changes when in telegram mode
  useEffect(() => {
    if (themeMode !== "telegram" || !isTelegramAvailable) {
      // Remove Telegram CSS variables when not in telegram mode
      removeTelegramThemeParams();
      return;
    }

    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    // Apply initial Telegram theme params
    const params = getTelegramThemeParams();
    setTelegramThemeParams(params);
    applyTelegramThemeParams(params);

    const handleThemeChange = () => {
      const root = document.documentElement;
      root.classList.add("theme-transition");
      setIsTransitioning(true);
      
      const newTheme = tg.colorScheme;
      setTheme(newTheme);
      
      // Update Telegram theme params
      const newParams = getTelegramThemeParams();
      setTelegramThemeParams(newParams);
      applyTelegramThemeParams(newParams);
      
      // Update Telegram header/background colors
      const bgColor = newParams?.bg_color || (newTheme === 'dark' ? '#1a1a1a' : '#FDF8F3');
      tg.setHeaderColor(bgColor);
      tg.setBackgroundColor(bgColor);
      
      setTimeout(() => {
        root.classList.remove("theme-transition");
        setIsTransitioning(false);
      }, 350);
    };

    tg.onEvent('themeChanged', handleThemeChange);
    return () => {
      tg.offEvent('themeChanged', handleThemeChange);
      removeTelegramThemeParams();
    };
  }, [themeMode, isTelegramAvailable]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (themeMode !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.add("theme-transition");
      setIsTransitioning(true);
      
      setTheme(e.matches ? "dark" : "light");
      
      setTimeout(() => {
        root.classList.remove("theme-transition");
        setIsTransitioning(false);
      }, 350);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  // Update theme when mode changes
  useEffect(() => {
    if (themeMode === "telegram") {
      const telegramTheme = getTelegramTheme();
      setTheme(telegramTheme || getSystemTheme());
      
      // Apply Telegram theme params
      const params = getTelegramThemeParams();
      setTelegramThemeParams(params);
      applyTelegramThemeParams(params);
    } else if (themeMode === "auto") {
      setTheme(getSystemTheme());
      setTelegramThemeParams(null);
    } else {
      setTheme(themeMode as Theme);
      setTelegramThemeParams(null);
    }
  }, [themeMode]);

  // Apply theme to document and update Telegram colors
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Update Telegram header/background colors if available
    if (isTelegramAvailable && window.Telegram?.WebApp) {
      const bgColor = telegramThemeParams?.bg_color || (theme === 'dark' ? '#1a1a1a' : '#FDF8F3');
      window.Telegram.WebApp.setHeaderColor(bgColor);
      window.Telegram.WebApp.setBackgroundColor(bgColor);
    }

    if (switchable) {
      localStorage.setItem("themeMode", themeMode);
      // Clean up old key
      localStorage.removeItem("theme");
    }
  }, [theme, themeMode, switchable, isTelegramAvailable, telegramThemeParams]);

  // Set theme mode with animation
  const setThemeMode = useCallback((mode: ThemeMode) => {
    if (!switchable) return;
    
    const root = document.documentElement;
    
    // Add transition class for smooth animation
    root.classList.add("theme-transition");
    setIsTransitioning(true);
    
    // Change mode
    setThemeModeState(mode);
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove("theme-transition");
      setIsTransitioning(false);
    }, 350);
  }, [switchable]);

  // Legacy toggle function (cycles through modes)
  const toggleTheme = useCallback(() => {
    if (!switchable) return;
    
    const root = document.documentElement;
    
    // Add transition class for smooth animation
    root.classList.add("theme-transition");
    setIsTransitioning(true);
    
    // Cycle through modes (include telegram if available)
    setThemeModeState(prev => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      if (prev === "auto") return isTelegramAvailable ? "telegram" : "light";
      return "light"; // telegram -> light
    });
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove("theme-transition");
      setIsTransitioning(false);
    }, 350);
  }, [switchable, isTelegramAvailable]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode,
      setThemeMode,
      toggleTheme: switchable ? toggleTheme : undefined, 
      switchable,
      isTransitioning,
      isTelegramAvailable,
      telegramThemeParams
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
