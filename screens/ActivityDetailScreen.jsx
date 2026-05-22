import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, MapPin, Clock, Calendar, Star, Navigation } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import CONFIG from '../constants/config';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fetch activity details from API
async function fetchActivityDetail(activityId) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), 15000);

  try {
    console.log('[ActivityDetail] === API Request Start ===');
    console.log('[ActivityDetail] Received Activity ID:', activityId);
    console.log('[ActivityDetail] Activity ID Type:', typeof activityId);
    console.log('[ActivityDetail] Activity ID Length:', activityId ? activityId.length : 'N/A');
    
    // Validate MongoDB ObjectId format
    if (activityId && typeof activityId === 'string' && activityId.length === 24 && /^[0-9a-fA-F]{24}$/.test(activityId)) {
      console.log('[ActivityDetail] ✓ Valid MongoDB ObjectId format');
    } else if (activityId) {
      console.warn('[ActivityDetail] ⚠ Activity ID may not be in valid MongoDB ObjectId format:', activityId);
    }
    
    console.log('[ActivityDetail] CONFIG.API_URL:', CONFIG.API_URL);
    
    const fullUrl = `${CONFIG.API_URL}/api/vibes/detail`;
    console.log('[ActivityDetail] Full API URL:', fullUrl);
    
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    console.log('[ActivityDetail] Token:', token ? 'Exists' : 'Not found');
    if (token) {
      console.log('[ActivityDetail] Token Value:', token.substring(0, 20) + '...');
    }
    
    // Convert activityId to string if it's an object
    const activityIdStr = typeof activityId === 'string' ? activityId : String(activityId);
    console.log('[ActivityDetail] Activity ID (converted):', activityIdStr);
    console.log('[ActivityDetail] Activity ID Type:', typeof activityIdStr);
    
    const requestBody = { activityId: activityIdStr };
    console.log('[ActivityDetail] Request Method: POST');
    console.log('[ActivityDetail] Request Headers:', JSON.stringify({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token.substring(0, 20)}...` } : {})
    }, null, 2));
    console.log('[ActivityDetail] Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    console.log('[ActivityDetail] Response Status:', response.status);
    console.log('[ActivityDetail] Response OK:', response.ok);
    
    // Log response headers
    console.log('[ActivityDetail] Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[ActivityDetail] Error Response Body:', body);
      throw new Error(`API returned ${response.status}${body ? `: ${body}` : ''}`);
    }

    const data = await response.json();
    console.log('[ActivityDetail] Success! Response Data:', JSON.stringify(data, null, 2));
    console.log('[ActivityDetail] === API Request End ===\n');
    return data;

  } catch (err) {
    console.error('[ActivityDetail] === API Request Failed ===');
    console.error('[ActivityDetail] Error Name:', err.name);
    console.error('[ActivityDetail] Error Message:', err.message);
    console.error('[ActivityDetail] Error Stack:', err.stack);
    
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}

// Open location in maps app
function openInMaps(placeName, latitude, longitude) {
  if (!latitude || !longitude) return;
  
  const label = encodeURIComponent(placeName || 'Location');
  const nativeUrl = Platform.OS === 'ios'
    ? `maps://?ll=${latitude},${longitude}&q=${label}`
    : `geo:${latitude},${longitude}?q=${label}`;

  Linking.canOpenURL(nativeUrl).then(supported => {
    if (supported) {
      Linking.openURL(nativeUrl);
    } else {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      );
    }
  });
}

export default function ActivityDetailScreen({ route, navigation }) {
  const { activityId } = route.params;
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activityId) {
      console.error('[ActivityDetail] No activityId provided in route params');
      setError('No activity ID provided');
      setLoading(false);
      return;
    }
    
    console.log('[ActivityDetail] Received activityId:', activityId);
    console.log('[ActivityDetail] activityId type:', typeof activityId);
    
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchActivityDetail(activityId)
      .then((data) => {
        if (!cancelled) {
          setActivity(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load activity details');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [activityId]);

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-AU', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle view on map
  const handleViewOnMap = () => {
    if (activity?.placeLongitude && activity?.placeLatitude) {
      navigation.navigate('ActivityLocationMap', {
        location: {
          latitude: activity.placeLatitude,
          longitude: activity.placeLongitude,
          title: activity.placeName,
        }
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loaderText}>Loading activity details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !activity) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <View style={s.errorContainer}>
          <Text style={s.errorEmoji}>⚠️</Text>
          <Text style={s.errorTitle}>Failed to Load</Text>
          <Text style={s.errorText}>{error || 'Activity not found'}</Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={s.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasLocation = activity.placeLongitude && activity.placeLatitude;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={s.heroContainer}>
          <ImageBackground
            source={{ uri: activity.img }}
            style={s.heroImage}
            imageStyle={s.heroImageStyle}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={s.heroGradient}
            >
              {/* Header with back button and kind badge */}
              <View style={s.headerOverlay}>
                <TouchableOpacity
                  style={s.backBtn}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>
                
                {/* Kind badge - moved to top right */}
                <View style={s.kindBadge}>
                  <Text style={s.kindBadgeText}>{activity.kind}</Text>
                </View>
              </View>

              {/* Title */}
              <View style={s.heroContent}>
                <Text style={s.heroTitle} numberOfLines={2}>{activity.title}</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Content */}
        <View style={s.contentContainer}>
          {/* Location Card - Only show if location exists */}
          {hasLocation && (
            <TouchableOpacity
              style={s.locationCard}
              onPress={handleViewOnMap}
              activeOpacity={0.85}
            >
              <View style={s.locationIconBox}>
                <MapPin size={20} color={colors.primary} strokeWidth={2.5} />
              </View>
              <View style={s.locationInfo}>
                <Text style={s.locationName}>{activity.placeName}</Text>
                <View style={s.locationMeta}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
                  <Text style={s.locationRating}>{activity.placeStar?.toFixed(1)}</Text>
                </View>
              </View>
              <View style={s.mapBtn}>
                <Navigation size={16} color="#000" strokeWidth={2.5} />
                <Text style={s.mapBtnText}>View on Map</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* No Location Notice */}
          {!hasLocation && (
            <View style={s.noLocationCard}>
              <Text style={s.noLocationIcon}>🌐</Text>
              <Text style={s.noLocationTitle}>Online Activity</Text>
              <Text style={s.noLocationText}>
                This is a virtual event with no physical location
              </Text>
            </View>
          )}

          {/* Time Info */}
          <View style={s.infoSection}>
            <View style={s.infoRow}>
              <View style={s.infoIconBox}>
                <Calendar size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Registration Deadline</Text>
                <Text style={s.infoValue}>{formatDateTime(activity.registration_end_time)}</Text>
              </View>
            </View>

            <View style={s.infoDivider} />

            <View style={s.infoRow}>
              <View style={s.infoIconBox}>
                <Clock size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Start Time</Text>
                <Text style={s.infoValue}>{formatDateTime(activity.start_time)}</Text>
              </View>
            </View>

            <View style={s.infoDivider} />

            <View style={s.infoRow}>
              <View style={s.infoIconBox}>
                <Clock size={18} color={colors.textMuted} strokeWidth={2} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>End Time</Text>
                <Text style={s.infoValue}>{formatDateTime(activity.end_time)}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={s.descriptionSection}>
            <Text style={s.sectionTitle}>About This Activity</Text>
            <Text style={s.descriptionText}>{activity.description}</Text>
          </View>

          {/* Spacer for bottom padding */}
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  // Header
  header: {
    padding: 16,
    paddingTop: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Hero Section
  heroContainer: {
    width: SCREEN_WIDTH,
    height: 320,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageStyle: {
    resizeMode: 'cover',
  },
  heroGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kindBadge: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  kindBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroContent: {
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
    letterSpacing: -0.5,
  },

  // Content Container
  contentContainer: {
    padding: 16,
  },

  // Location Card
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  locationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationRating: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  locationDot: {
    fontSize: 12,
    color: colors.textMuted,
  },
  locationCoords: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },

  // No Location Card
  noLocationCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noLocationIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  noLocationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  noLocationText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Info Section
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },

  // Description Section
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
});
