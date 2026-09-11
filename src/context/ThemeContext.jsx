import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_MODES } from '../utils/constants';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('messledger_theme') || THEME_MODES.LIGHT;
  });

  const [gridView, setGridViewState] = useState(() => {
    const saved = localStorage.getItem('messledger_grid_view');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let activeIsDark = false;
      if (theme === THEME_MODES.DARK) {
        activeIsDark = true;
      } else if (theme === THEME_MODES.LIGHT) {
        activeIsDark = false;
      } else if (theme === THEME_MODES.SYSTEM) {
        activeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(activeIsDark);
      if (activeIsDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('messledger_theme', theme);

    if (theme === THEME_MODES.SYSTEM) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const setGridView = (val) => {
    setGridViewState(val);
    localStorage.setItem('messledger_grid_view', JSON.stringify(val));
  };

  const toggleGridView = () => {
    setGridView((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme,
        gridView,
        setGridView,
        toggleGridView,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
