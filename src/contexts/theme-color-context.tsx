"use client";

import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeColorContextType {
  setThemeColor: (color: string) => void;
}

const ThemeColorContext = createContext<ThemeColorContextType | null>(null);

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColor] = useState('#000000');

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta#theme-color');
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    }
    
    if (metaStatusBar) {
      metaStatusBar.setAttribute('content', themeColor === '#ffffff' ? 'default' : 'black-translucent');
    }
  }, [themeColor]);

  return (
    <ThemeColorContext.Provider value={{ setThemeColor }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext);
  if (!context) {
    throw new Error('useThemeColor must be used within a ThemeColorProvider');
  }
  return context;
}