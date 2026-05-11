import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { LocationProvider } from './context/LocationContext';
import { SquadProvider }    from './context/SquadContext';
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
        <AuthProvider>
          {/* UserProvider must wrap LocationProvider — LocationContext calls
              updateUserLocation() from UserContext on every GPS refresh. */}
          <UserProvider>
            <LocationProvider>
              {/* SquadProvider inside LocationProvider: uses both useUser()
                  and useLocation() for proximity-sorted squad fetching. */}
              <SquadProvider>
                <AppContent />
              </SquadProvider>
            </LocationProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

