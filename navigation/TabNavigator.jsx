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
import { colors }   from '../constants/theme';

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

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
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
              <View style={[styles.fab, isFocused && styles.fabFocused]}>
                <Zap size={22} color="#000000" fill="#000000" strokeWidth={2.5} />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>Vibe</Text>
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
            <Text style={[styles.label, isFocused && styles.labelActive]}>
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
    backgroundColor: '#1C1F2A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 10,
    // Elevation / shadow
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Teal glow
    elevation: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  fabFocused: {
    backgroundColor: colors.primaryDark,
  },

  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
