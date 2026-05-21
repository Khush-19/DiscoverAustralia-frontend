import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { lightColors, darkColors } from '../constants/theme';

const THEME_KEY = 'discover_au_theme_preference';

export const ThemeContext = createContext({
  colors: darkColors,
  isDark: true,
  colorScheme: 'dark',
  themeMode: 'system', // 'light' | 'dark' | 'system'
  setThemeMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'
  const [themeMode, setThemeModeState] = useState('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const savedTheme = await SecureStore.getItemAsync(THEME_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme);
        }
      } catch (err) {
        console.log('[ThemeProvider] Error loading theme preference:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadThemePreference();
  }, []);

  // Determine effective color scheme based on theme mode
  const effectiveColorScheme = themeMode === 'system' ? systemColorScheme : themeMode;
  const isDark = effectiveColorScheme === 'dark';
  const colors = { ...(isDark ? darkColors : lightColors), isDark };

  // Save theme preference when it changes
  const setThemeMode = async (mode) => {
    try {
      await SecureStore.setItemAsync(THEME_KEY, mode);
      setThemeModeState(mode);
    } catch (err) {
      console.log('[ThemeProvider] Error saving theme preference:', err);
    }
  };

  return (
    <ThemeContext.Provider value={{ colors, isDark, colorScheme: effectiveColorScheme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};


