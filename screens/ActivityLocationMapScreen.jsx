import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { ArrowLeft, Navigation } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useLocation } from '../hooks/useLocation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ActivityLocationMapScreen({ route, navigation }) {
  const { location } = route.params;
  const { colors, isDark } = useTheme();
  const { coords } = useLocation();
  const s = getStyles(colors, isDark);
  const mapRef = useRef(null);

  const { latitude, longitude, title } = location;

  // Center the map on the location when component mounts
  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  }, [latitude, longitude]);

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{title || 'Location'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={{
          latitude: latitude || -33.8688,
          longitude: longitude || 151.2093,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {/* Simple marker for the activity location */}
        {latitude && longitude && (
          <Marker
            coordinate={{ latitude, longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={s.markerContainer}>
              <View style={s.markerPin}>
                <View style={s.markerDot} />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Google Maps Navigation Button */}
      {latitude && longitude && (
        <TouchableOpacity
          style={s.navigateBtn}
          onPress={() => {
            const url = Platform.select({
              ios: `comgooglemaps://?daddr=${latitude},${longitude}&dirflg=d`,
              android: `google.navigation:q=${latitude},${longitude}`,
            });
            Linking.openURL(url).catch(() => {
              // Fallback to web URL if app not installed
              Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
            });
          }}
          activeOpacity={0.8}
        >
          <Navigation size={20} color="#fff" fill="#fff" />
        </TouchableOpacity>
      )}

      {/* Bottom info card */}
      {title && (
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>{title}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  infoCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoCoords: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  navigateBtn: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
