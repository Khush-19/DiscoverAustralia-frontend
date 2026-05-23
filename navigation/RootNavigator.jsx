import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

import TabNavigator from './TabNavigator';
import LocationDetailScreen from '../screens/LocationDetailScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import FullMapScreen from '../screens/FullMapScreen';
import ActivityLocationMapScreen from '../screens/ActivityLocationMapScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';
import PersonalizedRecommendationSettingsScreen from '../screens/PersonalizedRecommendationSettingsScreen';
import HelpScreen from '../screens/HelpScreen';
import VibeDetailScreen from '../screens/VibeDetailScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import FreePlacesScreen from '../screens/FreePlacesScreen';
import CreateSquadScreen from '../screens/CreateSquadScreen';
import SelectActivityScreen from '../screens/SelectActivityScreen';
import SelectActivityDetailScreen from '../screens/SelectActivityDetailScreen';

const Stack = createNativeStackNavigator();

// ─── Auth stack (unauthenticated) ─────────────────────────────────────────────
// 未登录状态下的导航
function AuthStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // Slide-up feels more modern for auth flows
        animation: 'slide_from_bottom',
        animationDuration: 260,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}

// ─── App stack (authenticated) ────────────────────────────────────────────────
// 已经登录状态下的导航
function AppStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: 220,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ animation: 'none' }} />
      <Stack.Screen name="LocationDetail" component={LocationDetailScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom', animationDuration: 280 }}
      />
      <Stack.Screen name="FullMap" component={FullMapScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="Messages" component={MessagesScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="PersonalizedRecommendationSettings" component={PersonalizedRecommendationSettingsScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="Help" component={HelpScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="VibeDetail" component={VibeDetailScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="ActivityLocationMap" component={ActivityLocationMapScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 280 }}
      />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="FreePlaces" component={FreePlacesScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="CreateSquad" component={CreateSquadScreen}
        options={{ 
          animation: 'slide_from_bottom', 
          animationDuration: 280 
        }}
      />
      <Stack.Screen name="SelectActivity" component={SelectActivityScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
      <Stack.Screen name="SelectActivityDetail" component={SelectActivityDetailScreen}
        options={{ animation: 'slide_from_right', animationDuration: 240 }}
      />
    </Stack.Navigator>
  );
}

// ─── Splash / loading screen ──────────────────────────────────────────────────
// Shown for the ~200 ms while bootstrapAsync reads the secure store on cold start.
// Keeping it minimal avoids a flash of wrong content.

function SplashScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────
// Decision tree:
//   isLoading  → SplashScreen   (secure-store check in progress)
//   userToken  → AppStack       (valid session exists)
//   otherwise  → AuthStack      (no session, show login)

export default function RootNavigator() {
  const { isLoading, userToken } = useAuth();

  if (isLoading) return <SplashScreen />;

  return userToken ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
