import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, ChevronRight, Flame, Clock, Navigation } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../hooks/useUser';
import { useLocation } from '../hooks/useLocation';
import { VIBES } from '../constants/vibes';
import { discoveryService } from '../services/discoveryService';
import InsightCard from '../components/InsightCard';
import TrendAlert from '../components/TrendAlert';
import LocationBanner from '../components/LocationBanner';
import VibePicker from '../components/VibePicker';
import SpotCard from '../components/SpotCard';
import SquadBanner from '../components/SquadBanner';
import useFadeIn from '../hooks/useFadeIn';


// ─── Static data ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: '1', label: 'Free Today',   emoji: '💸' },
  { id: '2', label: 'Join a Squad', emoji: '👥' },
  { id: '3', label: 'Near Me',      emoji: '📍' },
  { id: '4', label: 'Beach Day',    emoji: '🏖️' },
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

export default function HomeScreen() {
  const fadeStyle              = useFadeIn();
  const { colors, isDark }     = useTheme();
  const { userName, updateVibe } = useUser();
  const { coords }             = useLocation();
  const s = React.useMemo(() => getStyles(colors), [colors]);

  const [selectedVibe,  setSelectedVibe]  = useState(null);
  const [spots,         setSpots]         = useState([]);
  const [spotsLoading,  setSpotsLoading]  = useState(false);

  // Fetch spots whenever the selected vibe or user's coords change
  useEffect(() => {
    if (!selectedVibe) return;
    let cancelled = false;
    setSpotsLoading(true);
    discoveryService.getSpotsByVibe(selectedVibe.id, coords)
      .then(data  => { if (!cancelled) setSpots(data); })
      .catch(()   => {})
      .finally(() => { if (!cancelled) setSpotsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedVibe?.id, coords]);

  function handleVibeSelect(vibe) {
    setSelectedVibe(vibe);
    updateVibe(vibe); // sync to UserContext for Aura engine
  }

  return (
    <Animated.View style={[{ flex: 1 }, fadeStyle]}>
      <SafeAreaView style={s.screen} edges={['top']}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
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
            <TouchableOpacity style={s.avatarWrap} activeOpacity={0.85}>
              <View style={s.avatar}>
                <Text style={s.avatarInitials}>
                  {userName ? userName.slice(0, 2).toUpperCase() : 'ME'}
                </Text>
              </View>
              <View style={s.notifDot} />
            </TouchableOpacity>
          </View>

          {/* ── Early Risk Warning (shown when 3-day negative trend detected) ── */}
          <TrendAlert />

          {/* ── Predictive Insight (shown when sleep < 7h) ──────────────────── */}
          <InsightCard />

          {/* ── Discovery Hero Card ─────────────────────────────────────────── */}
          <TouchableOpacity activeOpacity={0.9} style={s.heroShell}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' }}
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
                    <Text style={s.heroTitle}>Bondi to Coogee Walk 🐚</Text>
                    <View style={s.heroMeta}>
                      {/* Stars */}
                      <View style={s.starsRow}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={11} color="#F59E0B" fill="#F59E0B" />
                        ))}
                      </View>
                      <Text style={s.heroMetaText}>4.5</Text>
                      <Text style={s.dot}>·</Text>
                      <Clock size={11} color="#D1D5DB" />
                      <Text style={s.heroMetaText}>2.5 hrs</Text>
                      <Text style={s.dot}>·</Text>
                      <Navigation size={11} color="#D1D5DB" />
                      <Text style={s.heroMetaText}>5.9 km</Text>
                    </View>
                  </View>

                  <View style={s.heroActions}>
                    <View style={s.freeBadge}>
                      <Text style={s.freeBadgeText}>FREE</Text>
                    </View>
                    <TouchableOpacity style={s.goBtn} activeOpacity={0.85}>
                      <Text style={s.goBtnText}>Do →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* ── Quick Actions ───────────────────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.quickScroll}
            style={s.quickContainer}
          >
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity key={a.id} style={s.quickPill} activeOpacity={0.75}>
                <Text style={s.quickEmoji}>{a.emoji}</Text>
                <Text style={s.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Pick Your Vibe ──────────────────────────────────────────────── */}
          <View style={s.section}>
            <SectionHeader title="Pick Your Vibe" onSeeAll={() => {}} />
            <VibePicker
              vibes={VIBES}
              selectedId={selectedVibe?.id ?? null}
              onSelect={handleVibeSelect}
            />
          </View>

          {/* ── Trending Today / Vibe Spots ─────────────────────────────────── */}
          <View style={s.section}>
            <SectionHeader
              title={selectedVibe ? `${selectedVibe.emoji} ${selectedVibe.label}` : '🔥 Trending Today'}
              onSeeAll={() => {}}
            />
            {spotsLoading ? (
              <View style={s.spotsLoader}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.spotsScroll}
              >
                {spots.map(spot => (
                  <SpotCard key={spot.id} spot={spot} />
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── Squad-Up Banner — live, data-driven via SquadContext ──────── */}
          <SquadBanner />

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
  quickContainer: { marginBottom: 22 },
  quickScroll: { paddingHorizontal: 16, gap: 8 },
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

  // ── Spots feed (SpotCard horizontal list)
  spotsScroll: { paddingHorizontal: 16, gap: 12 },
  spotsLoader: { height: 158, alignItems: 'center', justifyContent: 'center' },

  // Squad-Up banner is now <SquadBanner /> — styles live in SquadBanner.jsx
});

