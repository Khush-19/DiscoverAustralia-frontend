import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * useTheme hook to consume the ThemeContext.
 * Must be used within a ThemeProvider.
 */
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
