import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  adaptiveDifficulty: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  soundEnabled: true,
  animationsEnabled: true,
  adaptiveDifficulty: true,
  fontSize: 'medium'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const currentThemeRef = useRef<string | null>(null);
  const themeMediaQuery = useRef<MediaQueryList | null>(null);
  
  // Optimized theme application with reduced DOM operations
  const applyTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    // Skip unnecessary theme application if it's the same theme
    if (theme === currentThemeRef.current) return;
    currentThemeRef.current = theme;
    
    const isDark = theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Only modify DOM if needed
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    
    if (isDark !== isCurrentlyDark) {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Set up system theme listener, cleanup properly on unmount
  useEffect(() => {
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };

    // Set up media query listener
    themeMediaQuery.current = window.matchMedia('(prefers-color-scheme: dark)');
    themeMediaQuery.current.addEventListener('change', handleSystemThemeChange);

    // Initial theme application
    const savedSettings = localStorage.getItem('mathAppSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      applyTheme(parsedSettings.theme);
    } else {
      applyTheme(defaultSettings.theme);
    }
    
    return () => {
      if (themeMediaQuery.current) {
        themeMediaQuery.current.removeEventListener('change', handleSystemThemeChange);
      }
    };
  }, [applyTheme]);

  // Debounced localStorage save to reduce blocking operations
  const debouncedSave = useCallback((data: AppSettings) => {
    // Use requestAnimationFrame to batch with rendering
    requestAnimationFrame(() => {
      localStorage.setItem('mathAppSettings', JSON.stringify(data));
    });
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>): void => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save to localStorage with debouncing
    debouncedSave(updatedSettings);
    
    // Apply theme if it was updated
    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};