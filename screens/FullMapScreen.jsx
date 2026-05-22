import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Minus, Compass, MapPin, Navigation, Star } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../hooks/useTheme';
import { discoveryService } from '../services/discoveryService';

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

  // State for activities data
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Default region: Sydney if coords aren't available yet
  const [region, setRegion] = useState({
    latitude: coords?.latitude ?? -33.8885,
    longitude: coords?.longitude ?? 151.1873,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  // Fetch activities on mount and when coords change
  useEffect(() => {
    fetchActivities();
  }, [coords]);

  const fetchActivities = async () => {
    if (!coords) return;
    
    setIsLoadingActivities(true);
    try {
      const data = await discoveryService.getActivitiesWithin200km(coords);
      setActivities(data);
      console.log('[FullMapScreen] Loaded', data.length, 'activities');
    } catch (error) {
      console.error('[FullMapScreen] Failed to fetch activities:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

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
    fetchActivities(); // Re-fetch activities when recentering
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
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
  const locationName = cityName || 'Sydney';

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
          <Text style={s.headerTitle} numberOfLines={1}>Explore {locationName}</Text>
          <Text style={s.headerSubtitle}>
            {activities.length} places within 200km
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

          {/* Activity Markers from API */}
          {activities.map((activity) => (
            <Marker
              key={activity.id}
              coordinate={{ latitude: activity.latitude, longitude: activity.longitude }}
              onPress={() => setSelectedActivity(activity)}
              tracksViewChanges={true}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={s.markerWrapper}>
                <Image 
                  source={{ uri: activity.img }} 
                  style={s.markerCircle}
                  resizeMode="cover"
                />
              </View>
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

        {/* Loading overlay when fetching activities */}
        {isLoadingActivities && (
          <View style={s.mapLoadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>Loading nearby activities...</Text>
          </View>
        )}
      </View>

      {/* Floating Bottom Info Panel */}
      <View style={s.bottomPanel}>
        {selectedActivity ? (
          // Show selected activity info
          <View>
            <View style={s.infoRow}>
              <Image source={{ uri: selectedActivity.img }} style={s.activityImage} />
              <View style={s.infoTextContainer}>
                <Text style={s.infoTitle} numberOfLines={1}>{selectedActivity.name}</Text>
                <View style={s.ratingRow}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={s.ratingText}>{selectedActivity.star}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={s.clearSelectionBtn} 
              onPress={() => setSelectedActivity(null)}
              activeOpacity={0.7}
            >
              <Text style={s.clearSelectionText}>Clear Selection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Show default location info
          <View>
            <View style={s.infoRow}>
              <MapPin size={18} color={colors.primary} strokeWidth={2.5} />
              <View style={s.infoTextContainer}>
                <Text style={s.infoTitle}>{locationName}</Text>
                <Text style={s.infoSubtitle}>
                  Tap a marker to view details
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
        )}
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
    markerWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    markerCircle: {
      width: 30,
      height: 30,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: '#ffffff',
      backgroundColor: colors.surfaceLight,
    },
    markerBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: 'rgba(0,0,0,0.75)',
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    markerBadgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '700',
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
      flex: 1,
    },
    activityImage: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: colors.surfaceLight,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    ratingText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    clearSelectionBtn: {
      marginTop: 12,
      paddingVertical: 8,
      alignItems: 'center',
      backgroundColor: colors.surfaceLight,
      borderRadius: 8,
    },
    clearSelectionText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
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
