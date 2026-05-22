import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  MapPin,
  Star,
  Share2,
  Calendar,
  Clock,
  Info,
  Navigation as NavigationIcon,
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { discoveryService } from '../services/discoveryService';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 280;

export default function PlaceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const placeId = route.params?.placeId;
  
  const [placeDetail, setPlaceDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlaceDetail();
  }, [placeId]);

  const fetchPlaceDetail = async () => {
    if (!placeId) {
      setError('No place ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await discoveryService.getPlaceDetail(placeId);
      setPlaceDetail(data);
      console.log('[PlaceDetailScreen] Place detail loaded:', data);
    } catch (err) {
      console.error('[PlaceDetailScreen] Failed to fetch place detail:', err);
      setError(err.message || 'Failed to load place details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!placeDetail) return;
    
    try {
      await Share.share({
        message: `Check out ${placeDetail.name}! ${placeDetail.description}`,
        title: placeDetail.name,
      });
    } catch (err) {
      console.error('[PlaceDetailScreen] Share failed:', err);
    }
  };

  const handleNavigate = () => {
    if (!placeDetail) return;
    
    // Navigate to activity location map with this location focused
    navigation.navigate('ActivityLocationMap', {
      location: {
        latitude: placeDetail.latitude,
        longitude: placeDetail.longitude,
        title: placeDetail.name,
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Loading place details...</Text>
      </View>
    );
  }

  if (error || !placeDetail) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.errorContainer}>
          <Text style={s.errorText}>{error || 'Place not found'}</Text>
          <TouchableOpacity
            style={s.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={s.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={s.heroContainer}>
          <Image
            source={{ uri: placeDetail.img }}
            style={s.heroImage}
            resizeMode="cover"
          />
          
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(10,14,18,0.9)' : 'rgba(0,0,0,0.7)']}
            style={s.heroGradient}
          />

          {/* Header buttons */}
          <View style={s.headerButtons}>
            <TouchableOpacity
              style={s.iconButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
            
            <View style={s.headerActions}>
              <TouchableOpacity
                style={s.iconButton}
                onPress={handleNavigate}
              >
                <NavigationIcon size={22} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={s.iconButton}
                onPress={handleShare}
              >
                <Share2 size={22} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title and rating overlay */}
          <View style={s.heroContent}>
            <View style={s.titleRow}>
              <Text style={s.placeName}>{placeDetail.name}</Text>
              {placeDetail.tag && (
                <View style={[s.tagBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={s.tagText}>{placeDetail.tag}</Text>
                </View>
              )}
            </View>
            
            <View style={s.ratingRow}>
              <Star size={18} color="#F59E0B" fill="#F59E0B" />
              <Text style={s.ratingText}>{placeDetail.star.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={s.content}>
          {/* Description */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Info size={18} color={colors.primary} strokeWidth={2.5} />
              <Text style={s.sectionTitle}>About</Text>
            </View>
            <Text style={s.description}>{placeDetail.description}</Text>
          </View>

          {/* Important Info */}
          {placeDetail.important_info && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Calendar size={18} color={colors.primary} strokeWidth={2.5} />
                <Text style={s.sectionTitle}>Important Information</Text>
              </View>
              <View style={s.infoCard}>
                <Text style={s.infoText}>{placeDetail.important_info}</Text>
              </View>
            </View>
          )}

          {/* Activities */}
          {placeDetail.activities && placeDetail.activities.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Clock size={18} color={colors.primary} strokeWidth={2.5} />
                <Text style={s.sectionTitle}>
                  Activities ({placeDetail.activities.length})
                </Text>
              </View>
              
              <View style={s.activitiesList}>
                {placeDetail.activities.map((activity, index) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      s.activityCard,
                      index < placeDetail.activities.length - 1 && s.activityCardBorder
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      navigation.navigate('ActivityDetail', {
                        activityId: activity.id,
                        activityTitle: activity.title,
                      });
                    }}
                  >
                    <View style={s.activityInfo}>
                      <Text style={s.activityTitle} numberOfLines={2}>
                        {activity.title}
                      </Text>
                      <View style={s.activityMeta}>
                        <Calendar size={12} color={colors.textMuted} strokeWidth={2} />
                        <Text style={s.activityDate}>
                          {formatDate(activity.start_time)}
                        </Text>
                        <Text style={s.activityTimeSeparator}>•</Text>
                        <Clock size={12} color={colors.textMuted} strokeWidth={2} />
                        <Text style={s.activityTime}>
                          {formatTime(activity.start_time)}
                        </Text>
                      </View>
                    </View>
                    <View style={s.activityArrow}>
                      <Text style={s.arrowText}>›</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors = {}, isDark = false) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  // Hero section
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  headerButtons: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    letterSpacing: -0.5,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  ratingSeparator: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: isDark ? 'rgba(45,212,191,0.08)' : 'rgba(45,212,191,0.06)',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Activities
  activitiesList: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  activityCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityInfo: {
    flex: 1,
    gap: 6,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activityTimeSeparator: {
    fontSize: 12,
    color: colors.textMuted,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activityArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
});
