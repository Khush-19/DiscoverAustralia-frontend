import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './navigation/RootNavigator';
import { UserProvider } from './context/UserContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const { isDark, colors } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar 
        style={isDark ? 'light' : 'dark'} 
        backgroundColor={colors.background} 
      />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

