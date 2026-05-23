import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, ChevronRight, Flame, Clock, Navigation, Mail } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../hooks/useUser';
import { useLocation } from '../hooks/useLocation';
import { VIBES } from '../constants/vibes';
import LocationBanner from '../components/LocationBanner';
import VibePicker from '../components/VibePicker';
import SpotCard from '../components/SpotCard';
import SquadBanner from '../components/SquadBanner';
import RandomSquadRecommendation from '../components/RandomSquadRecommendation';
import useFadeIn from '../hooks/useFadeIn';
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount';
import { discoveryService } from '../services/discoveryService';


// ─── Static data ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: '1', label: 'Free Today',   emoji: '💸' },
  { id: '2', label: 'Join a Squad', emoji: '👥' },
  { id: '3', label: 'Near Me',      emoji: '📍' },
];


// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, onSeeAll }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll} style={s.seeAllRow} activeOpacity={0.7}>
        <Text style={s.seeAllText}>See all</Text>
        <ChevronRight size={13} color={colors.primary} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// VibeCard and TrendingCard replaced by shared VibePicker and SpotCard components

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const fadeStyle              = useFadeIn();
  const { colors, isDark }     = useTheme();
  const { userName, updateVibe } = useUser();
  const { coords }             = useLocation();
  const { unreadCount }        = useUnreadMessageCount(30000); // Poll every 30 seconds
  const s = React.useMemo(() => getStyles(colors), [colors]);

  // State for hot activity
  const [hotActivity, setHotActivity] = useState(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch hot activity on mount
  useEffect(() => {
    fetchHotActivity();
  }, []);

  const fetchHotActivity = async () => {
    try {
      setIsLoadingActivity(true);
      const data = await discoveryService.getHotActivity();
      setHotActivity(data);
      console.log('[HomeScreen] Hot activity loaded:', data);
    } catch (error) {
      console.error('[HomeScreen] Failed to fetch hot activity:', error);
    } finally {
      setIsLoadingActivity(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHotActivity();
  };

  const handleActivityPress = () => {
    if (hotActivity?.id) {
      navigation.navigate('ActivityDetail', {
        activityId: hotActivity.id,
      });
    }
  };

  function handleVibeSelect(vibe) {
    updateVibe(vibe); // sync to UserContext for Aura engine
    navigation.navigate('VibeDetail', { vibe });
  }

  return (
    <Animated.View style={[{ flex: 1 }, fadeStyle]}>
      <SafeAreaView style={s.screen} edges={['top']}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              {/* LocationBanner replaces the hardcoded city/temp line */}
              <LocationBanner />
              <Text style={s.greeting}>
                Hey, {userName?.split(' ')[0] ?? 'Explorer'} 👋
              </Text>
            </View>
            <TouchableOpacity 
              style={s.avatarWrap} 
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Messages')}
            >
              <View style={s.avatar}>
                <Mail size={20} color="#000" strokeWidth={2.5} />
              </View>
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Hot Activity Hero Card ─────────────────────────────────────── */}
          {isLoadingActivity ? (
            <View style={s.heroShell}>
              <View style={[s.heroCard, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14 }}>Loading hot activity...</Text>
              </View>
            </View>
          ) : hotActivity ? (
            <TouchableOpacity activeOpacity={0.9} style={s.heroShell} onPress={handleActivityPress}>
              <ImageBackground
                source={{ uri: hotActivity.img }}
                style={s.heroCard}
                imageStyle={s.heroImage}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.78)']}
                  style={s.heroGrad}
                >
                  {/* Trending pill */}
                  <View style={s.trendingPill}>
                    <Flame size={11} color="#F59E0B" fill="#F59E0B" />
                    <Text style={s.trendingPillText}>Trending</Text>
                  </View>

                  {/* Bottom content row */}
                  <View style={s.heroBottom}>
                    <View style={s.heroInfo}>
                      <Text style={s.heroTitle}>{hotActivity.title}</Text>
                      <View style={s.heroMeta}>
                        {/* Stars */}
                        <View style={s.starsRow}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star 
                              key={i} 
                              size={11} 
                              color={hotActivity.star != null && i <= Math.round(hotActivity.star) ? "#F59E0B" : "#6B7280"} 
                              fill={hotActivity.star != null && i <= Math.round(hotActivity.star) ? "#F59E0B" : "transparent"} 
                            />
                          ))}
                        </View>
                        <Text style={s.heroMetaText}>{hotActivity.star != null ? hotActivity.star.toFixed(1) : 'N/A'}</Text>
                        <Text style={s.dot}>·</Text>
                        <Clock size={11} color="#D1D5DB" />
                        <Text style={s.heroMetaText}>
                          {hotActivity.start_time ? new Date(hotActivity.start_time).toLocaleDateString('en-AU', { 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'TBD'}
                        </Text>
                        <Text style={s.dot}>·</Text>
                        <Navigation size={11} color="#D1D5DB" />
                        <Text style={s.heroMetaText}>{hotActivity.distanceKm != null ? `${hotActivity.distanceKm.toFixed(1)} km` : 'N/A'}</Text>
                      </View>
                    </View>

                    <View style={s.heroActions}>
                      <TouchableOpacity style={s.goBtn} activeOpacity={0.85}>
                        <Text style={s.goBtnText}>View →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ) : null}

          {/* ── Quick Actions ───────────────────────────────────────────────── */}
          <View style={s.quickContainer}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity 
                key={a.id} 
                style={s.quickPill} 
                activeOpacity={0.75}
                onPress={() => {
                  if (a.label === 'Join a Squad') {
                    navigation.navigate('Squads');
                  } else if (a.label === 'Near Me') {
                    navigation.navigate('FullMap');
                  } else if (a.label === 'Free Today') {
                    navigation.navigate('FreePlaces');
                  }
                }}
              >
                <Text style={s.quickEmoji}>{a.emoji}</Text>
                <Text style={s.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Pick Your Vibe ──────────────────────────────────────────────── */}
          <View style={s.section}>
            <SectionHeader title="Pick Your Vibe" onSeeAll={() => navigation.navigate('Vibe')} />
            <VibePicker
              vibes={VIBES.filter(v => ['bored-broke', 'study-break', 'squad-up'].includes(v.id))}
              onSelect={handleVibeSelect}
              squareMode={true}
              hideSubtitle={true}
            />
          </View>

          {/* ── Recommended Squad For You ───────────────────────────────────── */}
          <View style={s.section}>
            <SectionHeader title="💡 Recommended For You" onSeeAll={() => navigation.navigate('Squads')} />
            <RandomSquadRecommendation navigation={navigation} />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 8 },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  avatarInitials: { color: '#000', fontWeight: '800', fontSize: 15 },
  notifDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.background,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // ── Hero card
  heroShell: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    // Card shadow
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  heroCard: { height: 210, width: '100%' },
  heroImage: { borderRadius: 24 },
  heroGrad: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  trendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trendingPillText: { color: '#F59E0B', fontSize: 11, fontWeight: '700' },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 19, fontWeight: '800', color: '#fff', marginBottom: 7 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  starsRow: { flexDirection: 'row', gap: 1 },
  heroMetaText: { fontSize: 11, color: '#D1D5DB', fontWeight: '500' },
  dot: { color: '#6B7280', fontSize: 12, marginHorizontal: 1 },
  heroActions: { alignItems: 'flex-end', gap: 8, marginLeft: 14 },
  freeBadge: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  freeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  goBtn: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  goBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },

  // ── Quick Actions
  quickContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surfaceLight,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickEmoji: { fontSize: 14 },
  quickLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },

  // ── Section layout
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Squad-Up banner is now <SquadBanner /> — styles live in SquadBanner.jsx
});

