import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import LocationDetailScreen from '../screens/LocationDetailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Default push transition for any future stack screens
        animation: 'fade_from_bottom',
        animationDuration: 220,
        contentStyle: { backgroundColor: '#111418' },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ animation: 'none' }}
      />
      <Stack.Screen
        name="LocationDetail"
        component={LocationDetailScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 280,
        }}
      />
    </Stack.Navigator>
  );
}
