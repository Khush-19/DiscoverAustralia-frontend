import { TouchableOpacity, Text, View, ImageBackground, Linking, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MapPin, Navigation } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

// ─── Maps deep-link ───────────────────────────────────────────────────────────
// iOS  → Apple Maps (maps://) with geo-coords and label
// Android → geo: URI which the system resolves to the default maps app
// Both fall back to Google Maps web URL if the native scheme fails

function openInMaps(spot) {
  const label = encodeURIComponent(spot.name + ' Sydney');

  if (spot.coords) {
    const { latitude, longitude } = spot.coords;
    const nativeUrl = Platform.OS === 'ios'
      ? `maps://?ll=${latitude},${longitude}&q=${label}`
      : `geo:${latitude},${longitude}?q=${label}`;

    Linking.canOpenURL(nativeUrl).then(supported => {
      if (supported) {
        Linking.openURL(nativeUrl);
      } else {
        // Fallback: Google Maps web — works on every platform
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        );
      }
    });
  } else {
    // No coords available — search by name
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${label}`
    );
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Spot card for the Trending Today / Discovery feed.
 *
 * Props:
 *   spot     — spot object from discoveryService
 *   onPress  — optional callback for the full card tap (future detail screen)
 */
export default function SpotCard({ spot, onPress }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={s.shell}
      onPress={onPress}
    >
      <ImageBackground
        source={{ uri: spot.imageURL }}
        style={s.card}
        imageStyle={s.image}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.92)']}
          style={s.gradient}
        >
          {/* ── Badge top-left ─────────────────────────────────────────── */}
          <View style={[s.badge, { backgroundColor: spot.badgeColor }]}>
            <Text style={s.badgeText}>{spot.badge}</Text>
          </View>

          {/* ── Bottom content ─────────────────────────────────────────── */}
          <View style={s.bottom}>
            <View style={s.info}>
              <Text style={s.name} numberOfLines={1}>{spot.name}</Text>

              {/* Rating + distance row */}
              <View style={s.metaRow}>
                <Star size={10} color="#F59E0B" fill="#F59E0B" />
                <Text style={s.metaText}>{spot.rating.toFixed(1)}</Text>
                <Text style={s.dot}>·</Text>
                <MapPin size={10} color="#9CA3AF" />
                <Text style={s.metaText}>
                  {spot.distanceLabel ?? `${spot.distanceKm} km`}
                </Text>
              </View>
            </View>

            {/* ── Go button → opens native maps ─────────────────────────── */}
            <TouchableOpacity
              style={s.goBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                openInMaps(spot);
              }}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Navigation size={12} color="#000" strokeWidth={2.5} />
              <Text style={s.goBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(colors, isDark) {
  return StyleSheet.create({
    shell: {
      borderRadius: 20,
      overflow: 'hidden',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
    },
    card: {
      width: 172,
      height: 158,
    },
    image: {
      borderRadius: 20,
    },
    gradient: {
      flex: 1,
      borderRadius: 20,
      padding: 11,
      justifyContent: 'space-between',
    },

    // Badge
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },

    // Bottom row
    bottom: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    info: { flex: 1, marginRight: 8 },
    name: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 5,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metaText: { fontSize: 10, color: '#D1D5DB', fontWeight: '500' },
    dot: { color: '#6B7280', fontSize: 11, marginHorizontal: 1 },

    // Go button
    goBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 7,
      // Teal glow
      elevation: 5,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
    },
    goBtnText: {
      color: '#000',
      fontSize: 11,
      fontWeight: '800',
    },
  });
}
