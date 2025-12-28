import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme?: () => void;
  switchable: boolean;
  isTransitioning: boolean;
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

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  // Theme mode: light, dark, or auto
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (switchable) {
      const stored = localStorage.getItem("themeMode");
      if (stored === "light" || stored === "dark" || stored === "auto") {
        return stored;
      }
      // Migration: check for old "theme" key
      const oldTheme = localStorage.getItem("theme");
      if (oldTheme === "light" || oldTheme === "dark") {
        return oldTheme;
      }
    }
    return defaultTheme;
  });

  // Actual theme being applied (resolved from mode)
  const [theme, setTheme] = useState<Theme>(() => {
    if (themeMode === "auto") {
      return getSystemTheme();
    }
    return themeMode;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

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
    if (themeMode === "auto") {
      setTheme(getSystemTheme());
    } else {
      setTheme(themeMode);
    }
  }, [themeMode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("themeMode", themeMode);
      // Clean up old key
      localStorage.removeItem("theme");
    }
  }, [theme, themeMode, switchable]);

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

  // Legacy toggle function (cycles through: light -> dark -> auto -> light)
  const toggleTheme = useCallback(() => {
    if (!switchable) return;
    
    const root = document.documentElement;
    
    // Add transition class for smooth animation
    root.classList.add("theme-transition");
    setIsTransitioning(true);
    
    // Cycle through modes
    setThemeModeState(prev => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      return "light";
    });
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove("theme-transition");
      setIsTransitioning(false);
    }, 350);
  }, [switchable]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode,
      setThemeMode,
      toggleTheme: switchable ? toggleTheme : undefined, 
      switchable,
      isTransitioning 
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
