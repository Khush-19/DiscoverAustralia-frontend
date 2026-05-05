import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  TextInput,
  Modal,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Star,
  ChevronRight,
  Navigation,
  Mic,
} from 'lucide-react-native';
import { colors } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { fetchInsiderTip } from '../services/AuraAPI';

// ─── Static data ─────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'All',     emoji: '✨', label: 'All'     },
  { id: 'Beaches', emoji: '🏖️', label: 'Beaches' },
  { id: 'Cafes',   emoji: '☕', label: 'Cafes'   },
  { id: 'Parks',   emoji: '🌳', label: 'Parks'   },
  { id: 'Events',  emoji: '🎉', label: 'Events'  },
];

const MAP_DOTS = [
  { top: '20%', left: '30%', primary: true  },
  { top: '42%', left: '58%', primary: true  },
  { top: '25%', left: '74%', primary: false },
  { top: '58%', left: '40%', primary: false },
  { top: '50%', left: '82%', primary: true  },
];

const TRENDING = [
  {
    id: '1',
    title:      'Bondi Beach',
    badge:      'FREE',
    badgeColor: '#10B981',
    rating:     4.9,
    distance:   '4.2km',
    image:      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
  },
  {
    id: '2',
    title:      'Opera House',
    badge:      'FREE',
    badgeColor: '#10B981',
    rating:     4.8,
    distance:   '3.1km',
    image:      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=500&q=80',
  },
  {
    id: '3',
    title:      'Manly Beach',
    badge:      'TODAY',
    badgeColor: '#F59E0B',
    rating:     4.7,
    distance:   '18km',
    image:      'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=500&q=80',
  },
];

const NEAR_USYD = [
  {
    id: '1',
    title:      'Grounds of Alexandria',
    category:   'Café · Brunch',
    rating:     4.7,
    distance:   '0.21km',
    badge:      'Free',
    badgeColor: '#10B981',
    image:      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&q=80',
  },
  {
    id: '2',
    title:      'Royal Botanic Garden',
    category:   'Park · Nature',
    rating:     4.8,
    distance:   '5.3km',
    badge:      null,
    badgeColor: null,
    image:      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&q=80',
  },
];

// ─── Map preview card ─────────────────────────────────────────────────────────

function MapPreviewCard() {
  return (
    <View style={s.mapCard}>
      <LinearGradient
        colors={['#DDF0EC', '#CCE9E3', '#B8E2DA']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[s.mapPark, { top: '12%', left: '56%', width: '28%', height: '38%' }]} />
      <View style={[s.mapPark, { top: '60%', left: '4%',  width: '32%', height: '26%' }]} />
      <View style={s.mapWater} />
      <View style={[s.road, s.roadH, { top: '32%' }]} />
      <View style={[s.road, s.roadH, { top: '58%' }]} />
      <View style={[s.road, s.roadV, { left: '20%' }]} />
      <View style={[s.road, s.roadV, { left: '48%' }]} />
      <View style={[s.road, s.roadV, { left: '74%' }]} />
      <View style={[s.block, { top: '6%',  left: '4%',  width: '14%', height: '22%' }]} />
      <View style={[s.block, { top: '6%',  left: '22%', width: '22%', height: '22%' }]} />
      <View style={[s.block, { top: '40%', left: '22%', width: '22%', height: '14%' }]} />
      <View style={[s.block, { top: '40%', left: '50%', width: '20%', height: '14%' }]} />
      <View style={[s.block, { top: '40%', left: '76%', width: '18%', height: '22%' }]} />
      <View style={[s.block, { top: '66%', left: '38%', width: '26%', height: '15%' }]} />
      {MAP_DOTS.map((dot, i) => (
        <View key={i} style={[s.mapDotRing, { top: dot.top, left: dot.left }]}>
          <View style={[s.mapDotCore, dot.primary ? s.mapDotTeal : s.mapDotAmber]} />
        </View>
      ))}
      <View style={s.usydPin}>
        <MapPin size={18} color="#EF4444" fill="#EF4444" strokeWidth={0} />
        <View style={s.usydTag}>
          <Text style={s.usydTagText}>USYD</Text>
        </View>
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(10,14,18,0.82)']}
        style={s.mapBarGrad}
      >
        <View style={s.mapBarLeft}>
          <MapPin size={12} color={colors.primary} strokeWidth={2.5} />
          <Text style={s.mapBarText}>24 places near USYD</Text>
        </View>
        <TouchableOpacity style={s.fullMapBtn} activeOpacity={0.8}>
          <Text style={s.fullMapBtnText}>Full Map</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

// ─── Trending card ────────────────────────────────────────────────────────────

function TrendingCard({ item }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={s.trendingShell}>
      <ImageBackground
        source={{ uri: item.image }}
        style={s.trendingCard}
        imageStyle={s.trendingImg}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.88)']}
          style={s.trendingGrad}
        >
          <View style={[s.trendingBadge, { backgroundColor: item.badgeColor }]}>
            <Text style={s.trendingBadgeText}>{item.badge}</Text>
          </View>
          <View style={s.trendingBottom}>
            <Text style={s.trendingTitle}>{item.title}</Text>
            <View style={s.trendingMeta}>
              <Star size={11} color="#F59E0B" fill="#F59E0B" />
              <Text style={s.trendingRating}>{item.rating}</Text>
              <Text style={s.trendingDot}>·</Text>
              <Navigation size={10} color="#D1D5DB" strokeWidth={2} />
              <Text style={s.trendingDist}>{item.distance}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

// ─── Nearby card ──────────────────────────────────────────────────────────────

function NearbyCard({ item, isLast }) {
  return (
    <TouchableOpacity
      activeOpacity={0.72}
      style={[s.nearbyCard, !isLast && s.nearbyCardBorder]}
    >
      <Image source={{ uri: item.image }} style={s.nearbyThumb} />
      <View style={s.nearbyInfo}>
        <View style={s.nearbyTitleRow}>
          <Text style={s.nearbyTitle} numberOfLines={1}>{item.title}</Text>
          {item.badge && (
            <View style={[s.nearbyBadge, {
              backgroundColor: item.badgeColor + '20',
              borderColor:     item.badgeColor + '50',
            }]}>
              <Text style={[s.nearbyBadgeText, { color: item.badgeColor }]}>
                {item.badge}
              </Text>
            </View>
          )}
        </View>
        <Text style={s.nearbyCategory}>{item.category}</Text>
        <View style={s.nearbyMetaRow}>
          <View style={s.nearbyRatingGroup}>
            <Star size={11} color="#F59E0B" fill="#F59E0B" />
            <Text style={s.nearbyRatingText}>{item.rating}</Text>
          </View>
          <View style={s.nearbyDistGroup}>
            <Navigation size={10} color={colors.primary} strokeWidth={2.5} />
            <Text style={s.nearbyDistText}>{item.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, rightLabel, onRight }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {rightLabel && (
        <TouchableOpacity onPress={onRight} style={s.sectionRight} activeOpacity={0.7}>
          <Text style={s.sectionRightText}>{rightLabel}</Text>
          <ChevronRight size={13} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Aura Insider card ────────────────────────────────────────────────────────

function InsiderTipCard({ tip, isLoading, onDismiss }) {
  if (isLoading) {
    return (
      <View style={ic.loadingCard}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={ic.loadingText}>Consulting the locals...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#062523', '#0b3d37', '#0e4d45']}
      style={ic.card}
    >
      {/* 1-px teal line at the very top acts as an inner highlight */}
      <View style={ic.topAccent} />

      {/* Header: label + dismiss */}
      <View style={ic.header}>
        <View style={ic.labelRow}>
          <Text style={ic.sparkle}>✨</Text>
          <Text style={ic.label}>AURA INSIDER</Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <View style={ic.dismissBtn}>
            <Text style={ic.dismissX}>✕</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={ic.divider} />

      {/* Tip body */}
      <Text style={ic.tipText}>{tip}</Text>
    </LinearGradient>
  );
}

// ─── Voice modal ──────────────────────────────────────────────────────────────

function VoiceModal({ visible, onUse, onClose }) {
  const [phase, setPhase] = useState('listening');
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    setPhase('listening');

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.55, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();

    const timer = setTimeout(() => {
      loop.stop();
      pulse.setValue(1);
      setPhase('found');
    }, 1800);

    return () => { loop.stop(); clearTimeout(timer); };
  }, [visible]);

  const transcript = 'Searching for quiet study spots in your local dialect...';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={sv.backdrop}>
        <View style={sv.sheet}>
          <View style={sv.micWrap}>
            {phase === 'listening' && (
              <Animated.View style={[sv.micRing, { transform: [{ scale: pulse }] }]} />
            )}
            <View style={[sv.micCircle, phase === 'found' && sv.micCircleDone]}>
              <Mic size={26} color={phase === 'found' ? '#000' : colors.primary} strokeWidth={2} />
            </View>
          </View>

          <Text style={sv.statusLabel}>
            {phase === 'listening' ? 'Listening...' : 'Got it!'}
          </Text>

          <View style={sv.transcriptBox}>
            <Text style={sv.transcriptText}>{transcript}</Text>
          </View>

          {phase === 'found' ? (
            <TouchableOpacity style={sv.useBtn} onPress={onUse} activeOpacity={0.85}>
              <Text style={sv.useBtnText}>Use this</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={sv.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={sv.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const { vibe, auraScore } = useUser();

  const [query,        setQuery]        = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [isSearching,  setIsSearching]  = useState(false);
  const [aiTip,        setAiTip]        = useState(null);

  // Core RAG search — called from both the keyboard submit and the voice modal.
  const triggerSearch = async (searchQuery) => {
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setAiTip(null);
    try {
      const vibeLabel  = vibe?.title ?? 'balanced';
      const scaledAura = (auraScore ?? 500) / 10; // convert 0–1000 → 0–100
      const tip = await fetchInsiderTip(searchQuery, vibeLabel, scaledAura);
      setAiTip(tip);
    } catch (err) {
      setAiTip(`Couldn't reach Aura Brain — ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVoiceUse = () => {
    setVoiceVisible(false);
    const voiceQuery = 'quiet study spots near USYD';
    setQuery(voiceQuery);
    triggerSearch(voiceQuery);
  };

  const handleDismissTip = () => {
    setAiTip(null);
    setQuery('');
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <View style={s.pageHeader}>
          <Text style={s.pageMeta}>DISCOVER</Text>
          <Text style={s.pageTitle}>Explore Sydney 🗺️</Text>
        </View>

        {/* ── Search bar ───────────────────────────────────────────────────── */}
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Search size={17} color={colors.primary} strokeWidth={2.2} />
            <TextInput
              style={s.searchInput}
              placeholder="Search places, vibes..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => triggerSearch(query)}
            />
            <TouchableOpacity
              onPress={() => setVoiceVisible(true)}
              activeOpacity={0.75}
              style={s.micBtn}
            >
              <Mic size={16} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.filterBtn} activeOpacity={0.8}>
            <SlidersHorizontal size={17} color="#000" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Filter pills ─────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersScroll}
          style={s.filtersContainer}
        >
          {FILTERS.map(f => {
            const active = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setActiveFilter(f.id)}
                activeOpacity={0.75}
                style={[s.filterPill, active && s.filterPillActive]}
              >
                <Text style={s.filterEmoji}>{f.emoji}</Text>
                <Text style={[s.filterLabel, active && s.filterLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Aura Insider tip ─────────────────────────────────────────────── */}
        {(isSearching || aiTip) && (
          <InsiderTipCard
            tip={aiTip}
            isLoading={isSearching}
            onDismiss={handleDismissTip}
          />
        )}

        {/* ── Map preview card ─────────────────────────────────────────────── */}
        <MapPreviewCard />

        {/* ── Trending Now ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title="🔥 Trending Now" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.trendingScroll}
          >
            {TRENDING.map(t => <TrendingCard key={t.id} item={t} />)}
          </ScrollView>
        </View>

        {/* ── Near USYD ────────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader
            title="📍 Near USYD"
            rightLabel="See map"
            onRight={() => {}}
          />
          <View style={s.nearbyList}>
            {NEAR_USYD.map((item, i) => (
              <NearbyCard
                key={item.id}
                item={item}
                isLast={i === NEAR_USYD.length - 1}
              />
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <VoiceModal
        visible={voiceVisible}
        onUse={handleVoiceUse}
        onClose={() => setVoiceVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 8 },

  // ── Page header
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 3,
  },
  pageMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },

  // ── Search bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    padding: 0,
  },
  micBtn: { padding: 4 },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // ── Filter pills
  filtersContainer: { marginBottom: 20 },
  filtersScroll:    { paddingHorizontal: 16, gap: 8 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterEmoji: { fontSize: 13 },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterLabelActive: {
    color: '#000000',
    fontWeight: '700',
  },

  // ── Map card
  mapCard: {
    marginHorizontal: 16,
    height: 190,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.2)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  mapPark: {
    position: 'absolute',
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderRadius: 8,
  },
  mapWater: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: '28%', height: '42%',
    backgroundColor: 'rgba(14,165,233,0.22)',
    borderTopLeftRadius: 40,
  },
  road: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.7)' },
  roadH: { left: 0, right: 0, height: 2.5 },
  roadV: { top: 0, bottom: 0, width: 2.5   },
  block: {
    position: 'absolute',
    backgroundColor: 'rgba(130,165,158,0.38)',
    borderRadius: 5,
  },
  mapDotRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(45,212,191,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapDotCore: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  mapDotTeal:  { backgroundColor: colors.primary },
  mapDotAmber: { backgroundColor: '#F59E0B'       },
  usydPin: {
    position: 'absolute',
    top: '44%',
    left: '37%',
    alignItems: 'center',
  },
  usydTag: {
    backgroundColor: '#EF4444',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginTop: 1,
  },
  usydTagText: { fontSize: 8, color: '#fff', fontWeight: '800' },
  mapBarGrad: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  mapBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  mapBarText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  fullMapBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  fullMapBtnText: { fontSize: 11, color: '#000', fontWeight: '800' },

  // ── Section wrapper
  section:       { marginBottom: 26 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionRightText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // ── Trending cards
  trendingScroll: { paddingHorizontal: 16, gap: 12 },
  trendingShell: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  trendingCard:  { width: 168, height: 200 },
  trendingImg:   { borderRadius: 24 },
  trendingGrad: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    borderRadius: 24,
  },
  trendingBadge: {
    alignSelf: 'flex-start',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  trendingBottom: { gap: 4 },
  trendingTitle:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingRating: { fontSize: 11, color: '#D1D5DB', fontWeight: '600' },
  trendingDot:    { color: '#6B7280', fontSize: 11 },
  trendingDist:   { fontSize: 11, color: '#D1D5DB', fontWeight: '500' },

  // ── Nearby list
  nearbyList: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 13,
  },
  nearbyCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nearbyThumb: {
    width: 82,
    height: 82,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
  },
  nearbyInfo:     { flex: 1, gap: 4 },
  nearbyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  nearbyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  nearbyBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nearbyBadgeText: { fontSize: 9, fontWeight: '800' },
  nearbyCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  nearbyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  nearbyRatingGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nearbyRatingText:  { fontSize: 12, color: '#D1D5DB', fontWeight: '600' },
  nearbyDistGroup:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nearbyDistText:    { fontSize: 12, color: colors.primary, fontWeight: '600' },
});

// ─── Insider tip card styles ──────────────────────────────────────────────────

const ic = StyleSheet.create({
  // Glassmorphism loading state
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(28,31,42,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.18)',
    elevation: 4,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // Deep teal tip card
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.25)',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  topAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(45,212,191,0.4)',
  },

  // Header row
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sparkle: { fontSize: 15 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  dismissBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissX: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '800',
    lineHeight: 14,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(45,212,191,0.18)',
    marginBottom: 14,
  },

  tipText: {
    fontSize: 14,
    color: '#D4F0EC',
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
});

// ─── Voice modal styles ───────────────────────────────────────────────────────

const sv = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    width: '80%',
    backgroundColor: colors.surface,
    borderRadius: 30,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.22)',
    elevation: 20,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  micWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(45,212,191,0.18)',
  },
  micCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(45,212,191,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(45,212,191,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  transcriptBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  transcriptText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  useBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 13,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  useBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  cancelBtn:  { paddingVertical: 6 },
  cancelText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
