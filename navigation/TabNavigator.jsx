import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, Zap, Users, User } from 'lucide-react-native';

import HomeScreen    from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import VibeScreen    from '../screens/VibeScreen';
import SquadsScreen  from '../screens/SquadsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Home',    Icon: Home,    label: 'Home'    },
  { name: 'Explore', Icon: Compass, label: 'Explore' },
  { name: 'Vibe',    Icon: Zap,     label: 'Vibe', isFAB: true },
  { name: 'Squads',  Icon: Users,   label: 'Squads'  },
  { name: 'Profile', Icon: User,    label: 'Profile' },
];

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View style={[
      styles.tabBar, 
      { 
        paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        backgroundColor: colors.surface,
        borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      }
    ]}>
      {state.routes.map((route, index) => {
        const tab      = TAB_CONFIG.find(t => t.name === route.name);
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // ── Centre FAB (Vibe) ──────────────────────────────────────────────
        if (tab?.isFAB) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.fabWrapper}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Vibe"
            >
              <View style={[
                styles.fab, 
                { backgroundColor: colors.primary },
                isFocused && { backgroundColor: colors.primaryDark }
              ]}>
                <Zap size={22} color={isDark ? "#000000" : "#FFFFFF"} fill={isDark ? "#000000" : "#FFFFFF"} strokeWidth={2.5} />
              </View>
              <Text style={[
                styles.label, 
                { color: colors.textMuted },
                isFocused && { color: colors.primary, fontWeight: '700' }
              ]}>Vibe</Text>
            </TouchableOpacity>
          );
        }

        // ── Regular tab ───────────────────────────────────────────────────
        const { Icon } = tab;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <Icon
              size={22}
              color={isFocused ? colors.primary : colors.textMuted}
              strokeWidth={isFocused ? 2.5 : 1.8}
            />
            <Text style={[
              styles.label, 
              { color: colors.textMuted },
              isFocused && { color: colors.primary, fontWeight: '700' }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeScreen}    />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Vibe"    component={VibeScreen}    />
      <Tab.Screen name="Squads"  component={SquadsScreen}  />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    // Elevation / shadow
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },

  // Regular tab slot
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  // FAB slot — lifts the button above the bar
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    gap: 3,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    // Teal glow
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },

  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

