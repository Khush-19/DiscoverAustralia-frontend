import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Star, Clock, Navigation, MapPin } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useLocation } from '../hooks/useLocation';
import { discoveryService } from '../services/discoveryService';
import { fetchActivitiesByKind } from '../services/AuraAPI';

// ─── Hero Spot Card Component ───────────────────────────────────────────────
// Each spot displayed as a full-width hero card (like HomeScreen's trending activity)

function HeroSpotCard({ spot }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <TouchableOpacity activeOpacity={0.9} style={s.heroSpotShell}>
      <ImageBackground
        source={{ uri: spot.imageURL }}
        style={s.heroSpotCard}
        imageStyle={s.heroSpotImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.78)']}
          style={s.heroSpotGrad}
        >
          {/* Badge top-left */}
          <View style={[s.spotBadge, { backgroundColor: spot.badgeColor }]}>
            <Text style={s.spotBadgeText}>{spot.badge}</Text>
          </View>

          {/* Bottom content row */}
          <View style={s.spotBottom}>
            <View style={s.spotInfo}>
              <Text style={s.spotName} numberOfLines={1}>{spot.name}</Text>
              
              {/* Rating + distance row */}
              <View style={s.spotMeta}>
                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                <Text style={s.spotMetaText}>{spot.rating.toFixed(1)}</Text>
                <Text style={s.dot}>·</Text>
                <MapPin size={11} color="#D1D5DB" />
                <Text style={s.spotMetaText}>
                  {spot.distanceLabel ?? `${spot.distanceKm} km`}
                </Text>
              </View>
            </View>

            <View style={s.spotActions}>
              <View style={s.freeBadge}>
                <Text style={s.freeBadgeText}>{spot.badge === 'FREE' ? 'FREE' : spot.badge}</Text>
              </View>
              <TouchableOpacity style={s.goBtn} activeOpacity={0.85}>
                <Navigation size={12} color="#000" strokeWidth={2.5} />
                <Text style={s.goBtnText}>Go →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

// ─── Activity Card Component ────────────────────────────────────────────────
// Displays activities from the new API

function ActivityCard({ activity }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.9} style={s.activityCardShell}>
      <ImageBackground
        source={{ uri: activity.img }}
        style={s.activityCard}
        imageStyle={s.activityCardImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.78)']}
          style={s.activityCardGrad}
        >
          {/* Kind badge top-left */}
          <View style={[s.activityKindBadge, { backgroundColor: colors.primary }]}>
            <Text style={s.activityKindBadgeText}>{activity.kind}</Text>
          </View>

          {/* Bottom content */}
          <View style={s.activityBottom}>
            <View style={s.activityInfo}>
              <Text style={s.activityTitle} numberOfLines={2}>{activity.title}</Text>
              
              {/* Time info */}
              <View style={s.activityMeta}>
                <Clock size={12} color="#D1D5DB" />
                <Text style={s.activityMetaText}>
                  {formatDate(activity.start_time)}
                </Text>
              </View>

              {/* Description preview */}
              <Text style={s.activityDescription} numberOfLines={2}>
                {activity.description}
              </Text>
            </View>

            <TouchableOpacity style={s.registerBtn} activeOpacity={0.85}>
              <Text style={s.registerBtnText}>Register</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function VibeDetailScreen({ route, navigation }) {
  const { vibe } = route.params;
  const { colors } = useTheme();
  const { coords } = useLocation();
  const s = getStyles(colors);

  const [spots, setSpots] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activities'); // 'activities' or 'spots'

  useEffect(() => {
    if (!vibe?.id) return;
    let cancelled = false;
    setLoading(true);

    // Fetch both spots and activities
    Promise.all([
      discoveryService.getSpotsByVibe(vibe.id, coords).catch(() => []),
      fetchActivitiesByKind(vibe.label).catch(() => [])
    ]).then(([spotsData, activitiesData]) => {
      if (!cancelled) {
        setSpots(spotsData);
        setActivities(activitiesData);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [vibe?.id, vibe?.label, coords]);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={vibe.colorGradientFull}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.headerBackground}
      >
        {/* Frosted glass overlay */}
        <BlurView intensity={50} tint="default" style={s.frostedGlass}>
          <View style={s.header}>
            <View style={s.headerContent}>
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={s.titleBlock}>
                <View style={s.titleRow}>
                  <Text style={s.title}>{vibe.label}</Text>
                  <Text style={s.emoji}>{vibe.emoji}</Text>
                </View>
                <Text style={s.subtitle}>{vibe.subtitle}</Text>
              </View>
            </View>
          </View>
        </BlurView>
      </LinearGradient>

      {/* Tab selector */}
      <View style={s.tabContainer}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'activities' && s.tabActive]}
          onPress={() => setActiveTab('activities')}
        >
          <Text style={[s.tabText, activeTab === 'activities' && s.tabTextActive]}>
            Activities ({activities.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'spots' && s.tabActive]}
          onPress={() => setActiveTab('spots')}
        >
          <Text style={[s.tabText, activeTab === 'spots' && s.tabTextActive]}>
            Spots ({spots.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeTab === 'activities' ? (
          // Activities tab
          activities.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>📅</Text>
              <Text style={s.emptyTitle}>No activities found</Text>
              <Text style={s.emptyText}>
                Check back later for upcoming events
              </Text>
            </View>
          ) : (
            <View style={s.activitiesList}>
              {activities.map((activity, index) => (
                <ActivityCard 
                  key={activity.id?.timestamp || index} 
                  activity={activity} 
                />
              ))}
            </View>
          )
        ) : (
          // Spots tab
          spots.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🔍</Text>
              <Text style={s.emptyTitle}>No spots found</Text>
              <Text style={s.emptyText}>
                Try adjusting your location or check back later
              </Text>
            </View>
          ) : (
            <View style={s.spotsList}>
              {spots.map(spot => (
                <HeroSpotCard key={spot.id} spot={spot} />
              ))}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBackground: {
    position: 'relative',
  },
  frostedGlass: {
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 3,
  },
  
  // Tab selector
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  
  // Hero Spot Card styles (full-width cards like HomeScreen's hero)
  heroSpotShell: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  heroSpotCard: { height: 210, width: '100%' },
  heroSpotImage: { borderRadius: 24 },
  heroSpotGrad: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  
  // Badge
  spotBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  spotBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  // Bottom row
  spotBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  spotInfo: { flex: 1, marginRight: 12 },
  spotName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 7,
  },
  spotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  spotMetaText: { fontSize: 11, color: '#D1D5DB', fontWeight: '500' },
  dot: { color: '#6B7280', fontSize: 12, marginHorizontal: 1 },
  
  // Actions
  spotActions: { alignItems: 'flex-end', gap: 8, marginLeft: 14 },
  freeBadge: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  freeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  goBtnText: { color: '#000', fontSize: 12, fontWeight: '800' },
  
  // Activity Card styles
  activityCardShell: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  activityCard: { height: 240, width: '100%' },
  activityCardImage: { borderRadius: 24 },
  activityCardGrad: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  
  // Activity kind badge
  activityKindBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  activityKindBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Activity bottom content
  activityBottom: {
    gap: 10,
  },
  activityInfo: { gap: 8 },
  activityTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 22,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityMetaText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  activityDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  registerBtn: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  registerBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  
  scrollContent: {
    padding: 16,
  },
  loader: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  spotsList: {
    gap: 16,
  },
  activitiesList: {
    gap: 16,
  },
});
