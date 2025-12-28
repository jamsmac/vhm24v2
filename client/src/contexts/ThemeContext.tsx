import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
type ThemeMode = "light" | "dark" | "auto" | "telegram";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme?: () => void;
  switchable: boolean;
  isTransitioning: boolean;
  isTelegramAvailable: boolean;
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

// Check if running in Telegram
function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp;
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

  // Listen for Telegram theme changes when in telegram mode
  useEffect(() => {
    if (themeMode !== "telegram" || !isTelegramAvailable) return;

    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const handleThemeChange = () => {
      const root = document.documentElement;
      root.classList.add("theme-transition");
      setIsTransitioning(true);
      
      const newTheme = tg.colorScheme;
      setTheme(newTheme);
      
      // Update Telegram header/background colors
      const bgColor = newTheme === 'dark' ? '#1a1a1a' : '#FDF8F3';
      tg.setHeaderColor(bgColor);
      tg.setBackgroundColor(bgColor);
      
      setTimeout(() => {
        root.classList.remove("theme-transition");
        setIsTransitioning(false);
      }, 350);
    };

    tg.onEvent('themeChanged', handleThemeChange);
    return () => tg.offEvent('themeChanged', handleThemeChange);
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
    } else if (themeMode === "auto") {
      setTheme(getSystemTheme());
    } else {
      setTheme(themeMode as Theme);
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
      const bgColor = theme === 'dark' ? '#1a1a1a' : '#FDF8F3';
      window.Telegram.WebApp.setHeaderColor(bgColor);
      window.Telegram.WebApp.setBackgroundColor(bgColor);
    }

    if (switchable) {
      localStorage.setItem("themeMode", themeMode);
      // Clean up old key
      localStorage.removeItem("theme");
    }
  }, [theme, themeMode, switchable, isTelegramAvailable]);

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
      isTelegramAvailable
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
