import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Minus, Compass, MapPin, Navigation } from 'lucide-react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../hooks/useTheme';

export default function FullMapScreen({ navigation }) {
  const {
    coords,
    cityName,
    suburb,
    temperature,
    weatherEmoji,
    isLoading,
    refreshLocation,
  } = useLocation();

  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Default region: Sydney if coords aren't available yet
  const [region, setRegion] = useState({
    latitude: coords?.latitude ?? -33.8885,
    longitude: coords?.longitude ?? 151.1873,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });

  // Pulse animation for user's custom location marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Sync region when user's coordinates refresh
  useEffect(() => {
    if (coords) {
      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      };
      setRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  }, [coords]);

  const handleRecenter = () => {
    refreshLocation();
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 1000);
    }
  };

  const handleZoom = (multiplier) => {
    if (!mapRef.current) return;
    const newLatitudeDelta = region.latitudeDelta * multiplier;
    const newLongitudeDelta = region.longitudeDelta * multiplier;
    
    const newRegion = {
      ...region,
      latitudeDelta: newLatitudeDelta,
      longitudeDelta: newLongitudeDelta,
    };
    
    setRegion(newRegion);
    mapRef.current.animateToRegion(newRegion, 600);
  };

  const lat = coords?.latitude ?? -33.8885;
  const lon = coords?.longitude ?? 151.1873;
  const locationName = suburb ? `${suburb}, ${cityName || 'Sydney'}` : (cityName || 'Camperdown, Sydney');

  // Hardcoded nearby coordinates relative to center
  const POIS = [
    {
      id: 'fisher',
      title: 'Fisher Library',
      description: 'USYD Central Library Study Area',
      latitude: lat - 0.001,
      longitude: lon - 0.0015,
      color: colors.primary,
    },
    {
      id: 'cafe',
      title: 'Victoria Park Cafe',
      description: 'Cosy outdoor brunch and coffee',
      latitude: lat + 0.002,
      longitude: lon + 0.0025,
      color: '#F59E0B',
    },
    {
      id: 'gardens',
      title: 'USYD Gardens',
      description: 'Serene green break zones',
      latitude: lat - 0.0025,
      longitude: lon + 0.001,
      color: '#10B981',
    },
  ];

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      {/* Header bar */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          activeOpacity={0.75}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerTitleContainer}>
          <Text style={s.headerTitle} numberOfLines={1}>Real-Time World Map</Text>
          <Text style={s.headerSubtitle}>
            GPS: {lat.toFixed(5)}, {lon.toFixed(5)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRecenter}
          style={s.compassBtn}
          activeOpacity={0.75}
        >
          <Compass size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Real Map View Area */}
      <View style={s.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          onRegionChangeComplete={(r) => setRegion(r)}
          showsCompass={false}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
        >
          {/* Main User Position Marker */}
          <Marker
            coordinate={{ latitude: lat, longitude: lon }}
            title="Your Location"
            description="You are currently here"
          >
            <View style={s.userLocationContainer}>
              <Animated.View
                style={[
                  s.userPulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.8],
                      outputRange: [0.6, 0],
                    }),
                  },
                ]}
              />
              <View style={s.userCorePin}>
                <View style={s.userCoreDot} />
              </View>
            </View>
          </Marker>

          {/* Surrounding POIs */}
          {POIS.map((poi) => (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              pinColor={poi.color}
            >
              <Callout tooltip>
                <View style={s.calloutContainer}>
                  <Text style={s.calloutTitle}>{poi.title}</Text>
                  <Text style={s.calloutDesc}>{poi.description}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Floating Zoom & Locate Controls */}
        <View style={s.controlsContainer}>
          <TouchableOpacity onPress={() => handleZoom(0.5)} style={s.controlBtn} activeOpacity={0.8}>
            <Plus size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleZoom(2.0)} style={s.controlBtn} activeOpacity={0.8}>
            <Minus size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRecenter} style={[s.controlBtn, s.locateBtn]} activeOpacity={0.8}>
            <Navigation size={16} color="#000" fill="#000" />
          </TouchableOpacity>
        </View>

        {/* Loading overlay when refreshing */}
        {isLoading && (
          <View style={s.mapLoadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>Locating GPS satellites...</Text>
          </View>
        )}
      </View>

      {/* Floating Bottom Info Panel */}
      <View style={s.bottomPanel}>
        <View style={s.infoRow}>
          <MapPin size={18} color={colors.primary} strokeWidth={2.5} />
          <View style={s.infoTextContainer}>
            <Text style={s.infoTitle}>{locationName}</Text>
            <Text style={s.infoSubtitle}>
              Latitude: {lat.toFixed(5)}° · Longitude: {lon.toFixed(5)}°
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.weatherRow}>
          <View style={s.weatherInfo}>
            <Text style={s.weatherEmojiText}>{weatherEmoji || '☀️'}</Text>
            <View>
              <Text style={s.weatherTemp}>
                {temperature != null ? `${temperature}°C` : '21°C'}
              </Text>
              <Text style={s.weatherLabelText}>Current Weather</Text>
            </View>
          </View>
          <TouchableOpacity style={s.navigateActionBtn} onPress={handleRecenter} activeOpacity={0.85}>
            <Text style={s.navigateActionText}>Recenter Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors, isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceLight,
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 12,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    compassBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceLight,
    },
    mapContainer: {
      flex: 1,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: colors.surfaceLight,
    },
    userLocationContainer: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userPulseRing: {
      position: 'absolute',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(45,212,191,0.4)',
    },
    userCorePin: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    userCoreDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    calloutContainer: {
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderRadius: 8,
      padding: 10,
      width: 160,
    },
    calloutTitle: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 12,
      marginBottom: 3,
    },
    calloutDesc: {
      color: '#d1d5db',
      fontSize: 10,
    },
    controlsContainer: {
      position: 'absolute',
      right: 16,
      top: 16,
      gap: 10,
      zIndex: 10,
    },
    controlBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locateBtn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      marginTop: 8,
    },
    mapLoadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      zIndex: 20,
    },
    loadingText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    bottomPanel: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomWidth: 0,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoTextContainer: {
      flex: 1,
      gap: 2,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    infoSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    weatherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    weatherInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    weatherEmojiText: {
      fontSize: 28,
    },
    weatherTemp: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    weatherLabelText: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    navigateActionBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 10,
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    navigateActionText: {
      color: '#000',
      fontWeight: '800',
      fontSize: 13,
    },
  });
}
