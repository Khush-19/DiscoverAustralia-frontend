import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Star,
  MapPin,
  ChevronRight,
  Flame,
  Clock,
  Navigation,
} from 'lucide-react-native';
import { colors, vibeGradients } from '../constants/theme';
import InsightCard from '../components/InsightCard';
import TrendAlert from '../components/TrendAlert';
import useFadeIn from '../hooks/useFadeIn';


// ─── Static data ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: '1', label: 'Free Today',   emoji: '💸' },
  { id: '2', label: 'Join a Squad', emoji: '👥' },
  { id: '3', label: 'Near Me',      emoji: '📍' },
  { id: '4', label: 'Beach Day',    emoji: '🏖️' },
];

const VIBES = [
  { id: '1', label: 'Bored & Broke',   sub: '4 spots',  emoji: '😴', grad: vibeGradients.boredBroke     },
  { id: '2', label: 'Study Break',     sub: '6 spots',  emoji: '📚', grad: vibeGradients.studyBreak     },
  { id: '3', label: 'Aussie Classics', sub: '24 spots', emoji: '🦘', grad: vibeGradients.aussieClassics },
];

const TRENDING = [
  {
    id: '1',
    title:      'Opera House Walk',
    badge:      'FREE',
    badgeColor: '#10B981',
    rating:     5.0,
    distance:   '4.1km',
    duration:   '2.5 hrs',
    image:      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80',
  },
  {
    id: '2',
    title:      'Chinatown Market',
    badge:      'TODAY',
    badgeColor: '#F59E0B',
    rating:     4.8,
    distance:   '3.1km',
    duration:   '1.5 hrs',
    image:      'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=400&q=80',
  },
];

const SQUAD_AVATARS = ['#EF4444', '#8B5CF6', '#3B82F6'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, onSeeAll }) {
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

function VibeCard({ item }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={s.vibeCardShell}>
      <LinearGradient
        colors={item.grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.vibeCard}
      >
        <Text style={s.vibeEmoji}>{item.emoji}</Text>
        <Text style={s.vibeLabel}>{item.label}</Text>
        <Text style={s.vibeSub}>{item.sub}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function TrendingCard({ item }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={s.trendingShell}>
      <ImageBackground
        source={{ uri: item.image }}
        style={s.trendingCard}
        imageStyle={s.trendingImage}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.88)']}
          style={s.trendingGrad}
        >
          <View style={[s.trendingBadge, { backgroundColor: item.badgeColor }]}>
            <Text style={s.trendingBadgeText}>{item.badge}</Text>
          </View>
          <Text style={s.trendingTitle}>{item.title}</Text>
          <View style={s.trendingMeta}>
            <Star size={10} color="#F59E0B" fill="#F59E0B" />
            <Text style={s.trendingMetaText}>{item.rating}</Text>
            <Text style={s.dot}>·</Text>
            <MapPin size={10} color="#9CA3AF" />
            <Text style={s.trendingMetaText}>{item.distance}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const fadeStyle = useFadeIn();

  return (
    <Animated.View style={[{ flex: 1 }, fadeStyle]}>
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.locationLine}>STAY • SYDNEY, 28°C ☀️</Text>
            <Text style={s.greeting}>Hey, Maya 👋</Text>
          </View>
          <TouchableOpacity style={s.avatarWrap} activeOpacity={0.85}>
            <View style={s.avatar}>
              <Text style={s.avatarInitials}>MA</Text>
            </View>
            {/* Notification badge */}
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
                      {[1,2,3,4,5].map(i => (
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.vibeScroll}
          >
            {VIBES.map(v => <VibeCard key={v.id} item={v} />)}
          </ScrollView>
        </View>

        {/* ── Trending Today ──────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title="🔥 Trending Today" onSeeAll={() => {}} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.trendingScroll}
          >
            {TRENDING.map(t => <TrendingCard key={t.id} item={t} />)}
          </ScrollView>
        </View>

        {/* ── Squad-Up Banner ─────────────────────────────────────────────── */}
        <TouchableOpacity style={s.squadBanner} activeOpacity={0.85}>
          <View style={s.squadLeft}>

            {/* Title row with live pill */}
            <View style={s.squadTitleRow}>
              <Text style={s.squadTitle}>Squad-Up 🏃</Text>
              <View style={s.livePill}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>Live</Text>
              </View>
            </View>

            <Text style={s.squadSub}>Students heading to Bondi</Text>

            {/* Avatars + stat pills */}
            <View style={s.squadRow}>
              {SQUAD_AVATARS.map((c, i) => (
                <View
                  key={i}
                  style={[s.squadAvatar, { backgroundColor: c, marginLeft: i === 0 ? 0 : -8 }]}
                />
              ))}
              <View style={s.statPill}>
                <Text style={s.statPillText}>3→</Text>
              </View>
              <View style={[s.statPill, s.statPillBlue]}>
                <Text style={[s.statPillText, s.statPillTextBlue]}>Bondi</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={s.joinBtn} activeOpacity={0.85}>
            <Text style={s.joinBtnText}>Join</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  scroll:  { paddingBottom: 8 },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  locationLine: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  avatarWrap:    { position: 'relative' },
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
  heroCard:  { height: 210, width: '100%' },
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
  heroInfo:  { flex: 1 },
  heroTitle: { fontSize: 19, fontWeight: '800', color: '#fff', marginBottom: 7 },
  heroMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  starsRow:  { flexDirection: 'row', gap: 1 },
  heroMetaText: { fontSize: 11, color: '#D1D5DB', fontWeight: '500' },
  dot:          { color: '#6B7280', fontSize: 12, marginHorizontal: 1 },
  heroActions:  { alignItems: 'flex-end', gap: 8, marginLeft: 14 },
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
  quickScroll:    { paddingHorizontal: 16, gap: 8 },
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
  section:      { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  seeAllRow:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText:   { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // ── Vibe cards
  vibeScroll:   { paddingHorizontal: 16, gap: 10 },
  vibeCardShell: { borderRadius: 20, overflow: 'hidden' },
  vibeCard: {
    width: 132,
    height: 112,
    padding: 14,
    justifyContent: 'flex-end',
  },
  vibeEmoji: { fontSize: 26, marginBottom: 5 },
  vibeLabel: { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 17 },
  vibeSub:   { fontSize: 10, color: 'rgba(255,255,255,0.68)', fontWeight: '500', marginTop: 2 },

  // ── Trending cards
  trendingScroll:  { paddingHorizontal: 16, gap: 12 },
  trendingShell:   { borderRadius: 20, overflow: 'hidden' },
  trendingCard:    { width: 162, height: 148, justifyContent: 'flex-end' },
  trendingImage:   { borderRadius: 20 },
  trendingGrad: {
    flex: 1,
    padding: 11,
    justifyContent: 'flex-end',
    borderRadius: 20,
  },
  trendingBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 6,
  },
  trendingBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  trendingTitle:     { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 4 },
  trendingMeta:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendingMetaText:  { fontSize: 10, color: '#D1D5DB', fontWeight: '500' },

  // ── Squad banner
  squadBanner: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  squadLeft:     { flex: 1 },
  squadTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  squadTitle:    { fontSize: 15, fontWeight: '800', color: colors.text },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  liveText: { fontSize: 10, color: colors.success, fontWeight: '700' },
  squadSub: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  squadRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  squadAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  statPill: {
    backgroundColor: 'rgba(45,212,191,0.14)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.25)',
    marginLeft: 4,
  },
  statPillText:     { fontSize: 10, color: colors.primary, fontWeight: '700' },
  statPillBlue:     { backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(59,130,246,0.25)' },
  statPillTextBlue: { color: '#60A5FA' },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginLeft: 12,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  joinBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
});
