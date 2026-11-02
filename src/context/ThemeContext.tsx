import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'purple' | 'gold' | 'emerald' | 'cyan';

interface ThemeContextType {
  mode: ThemeMode;
  accent: AccentColor;
  currency: 'BDT';
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  formatMoney: (amountBdt: number) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('se_theme_mode') as ThemeMode) || 'dark';
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    return (localStorage.getItem('se_theme_accent') as AccentColor) || 'purple';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('se_theme_mode', mode);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => setModeState(newMode);
  const toggleMode = () => setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
    localStorage.setItem('se_theme_accent', newAccent);
  };

  const formatMoney = (amountBdt: number): string => {
    const safeAmount = isNaN(amountBdt) ? 0 : amountBdt;
    return `৳${safeAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accent,
        currency: 'BDT',
        toggleMode,
        setMode,
        setAccent,
        formatMoney,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
