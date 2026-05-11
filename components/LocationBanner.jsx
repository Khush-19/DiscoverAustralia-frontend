import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { MapPin, Navigation, AlertCircle } from 'lucide-react-native';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';

// ─── Component ────────────────────────────────────────────────────────────────

export default function LocationBanner() {
  const {
    cityName,
    suburb,
    temperature,
    weatherEmoji,
    permissionStatus,
    isLoading,
    refreshLocation,
  } = useLocation();
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={s.row}>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={s.loadingText}>Locating you…</Text>
      </View>
    );
  }

  // ── Permission denied → deep-link to Settings ─────────────────────────────
  if (permissionStatus === 'denied') {
    return (
      <TouchableOpacity
        style={s.deniedRow}
        onPress={() => Linking.openSettings()}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <AlertCircle size={13} color={colors.warning} strokeWidth={2} />
        <Text style={s.deniedText}>Enable Location</Text>
      </TouchableOpacity>
    );
  }

  // ── Permission undetermined → prompt on tap ───────────────────────────────
  if (permissionStatus === 'undetermined' || !cityName) {
    return (
      <TouchableOpacity
        style={s.promptRow}
        onPress={refreshLocation}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Navigation size={13} color={colors.primary} strokeWidth={2} />
        <Text style={s.promptText}>Tap to find your location</Text>
      </TouchableOpacity>
    );
  }

  // ── Happy path: city + weather ────────────────────────────────────────────
  const displayPlace = suburb ? `${suburb}, ${cityName}` : cityName;
  const tempStr      = temperature != null ? ` · ${temperature}°C` : '';
  const emoji        = weatherEmoji ?? '';

  return (
    <View style={s.row}>
      <MapPin size={13} color={colors.primary} strokeWidth={2.5} />
      <Text style={s.locationText} numberOfLines={1}>
        {displayPlace}{tempStr} {emoji}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(colors, isDark) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 3,
    },
    locationText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.3,
      flexShrink: 1,
    },
    loadingText: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textMuted,
    },

    // Denied state
    deniedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 3,
    },
    deniedText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.warning,
      textDecorationLine: 'underline',
    },

    // Undetermined / tap-to-enable
    promptRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 3,
    },
    promptText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
  });
}
