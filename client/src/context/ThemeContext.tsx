import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get saved theme from localStorage or default to 'system'
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('theme') as ThemeMode;
    return savedMode || 'system';
  });
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Function to check if system prefers dark mode
  const systemPrefersDark = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Update the theme when mode changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Save the mode preference
    localStorage.setItem('theme', mode);
    
    // Determine if we should use dark mode
    let shouldBeDark = false;
    
    if (mode === 'dark') {
      shouldBeDark = true;
    } else if (mode === 'system') {
      shouldBeDark = systemPrefersDark();
    }
    
    // Update the class on the html element
    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    setIsDarkMode(shouldBeDark);
  }, [mode]);

  // Listen for system preference changes
  useEffect(() => {
    if (mode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      setIsDarkMode(systemPrefersDark());
      
      if (systemPrefersDark()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const value = {
    mode,
    setMode,
    isDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};