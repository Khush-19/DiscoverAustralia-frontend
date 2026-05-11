import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../constants/theme';

const ThemeContext = createContext({
  colors: darkColors,
  isDark: true,
  colorScheme: 'dark',
});

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme(); // 'light' or 'dark'
  const isDark = colorScheme === 'dark';
  const colors = { ...(isDark ? darkColors : lightColors), isDark };

  return (
    <ThemeContext.Provider value={{ colors, isDark, colorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
