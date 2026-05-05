import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import {
  X,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react-native';
import { colors, vibeGradients } from '../constants/theme';

// ─── Static data ─────────────────────────────────────────────────────────────

const VIBES = [
  {
    id:       '1',
    title:    'Bored & Broke',
    subtitle: 'Free things to do around you',
    emoji:    '😴',
    spots:    12,
    grad:     vibeGradients.boredBrokeFull,
    spotsAlpha: 'rgba(0,0,0,0.25)',
  },
  {
    id:       '2',
    title:    'Study Break',
    subtitle: 'Recharge spots & quiet cafes',
    emoji:    '📚',
    spots:    8,
    grad:     vibeGradients.studyBreakFull,
    spotsAlpha: 'rgba(0,0,0,0.22)',
  },
  {
    id:       '3',
    title:    'Aussie Classics',
    subtitle: 'Iconic local experiences',
    emoji:    '🦘',
    spots:    24,
    grad:     vibeGradients.aussieClassicsFull,
    spotsAlpha: 'rgba(0,0,0,0.2)',
  },
  {
    id:       '4',
    title:    'Night Out',
    subtitle: 'After-dark Sydney game',
    emoji:    '🌙',
    spots:    16,
    grad:     vibeGradients.nightOutFull,
    spotsAlpha: 'rgba(0,0,0,0.28)',
  },
  {
    id:       '5',
    title:    'Beach Vibes',
    subtitle: 'Sun, sand & surf today',
    emoji:    '🏄',
    spots:    9,
    grad:     vibeGradients.beachVibesFull,
    spotsAlpha: 'rgba(0,0,0,0.22)',
  },
];

const SQUAD_AVATARS = [
  { color: '#EF4444', initials: 'AK' },
  { color: '#8B5CF6', initials: 'MR' },
  { color: '#F59E0B', initials: 'JS' },
];

// ─── Vibe Card ───────────────────────────────────────────────────────────────

function VibeCard({ item }) {
  const scale      = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();
  const { vibe, updateVibe } = useUser();

  const isActive = vibe?.id === item.id;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  const onPress = () => {
    updateVibe(item);
    navigation.navigate('Home');
  };

  return (
    <Animated.View
      style={[
        s.vibeCardShell,
        { transform: [{ scale }] },
        isActive && s.vibeCardShellActive,
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={s.vibeCardTouch}
      >
        <LinearGradient
          colors={item.grad}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={s.vibeCard}
        >
          {/* Left — emoji circle */}
          <View style={s.emojiCircle}>
            <Text style={s.emojiText}>{item.emoji}</Text>
          </View>

          {/* Centre — title + subtitle */}
          <View style={s.vibeTextBlock}>
            <Text style={s.vibeTitle}>{item.title}</Text>
            <Text style={s.vibeSub} numberOfLines={1}>{item.subtitle}</Text>
          </View>

          {/* Right — spots badge  OR  active checkmark */}
          {isActive ? (
            <View style={s.activeCheckWrap}>
              <Text style={s.activeCheckText}>✓</Text>
            </View>
          ) : (
            <View style={[s.spotsBadge, { backgroundColor: item.spotsAlpha }]}>
              <Text style={s.spotsCount}>{item.spots}</Text>
              <Text style={s.spotsLabel}>spots</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Active Squad-Up Card ─────────────────────────────────────────────────────

function SquadUpCard() {
  return (
    <View style={s.squadCard}>
      {/* Subtle teal glow border */}
      <View style={s.squadGlowBorder} />

      <LinearGradient
        colors={['#1C2A28', '#151E1C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.squadGrad}
      >
        {/* Header row */}
        <View style={s.squadHeaderRow}>
          <View style={s.squadTitleGroup}>
            <Text style={s.squadTitle}>Squad-Up</Text>
            <Zap size={14} color={colors.primary} fill={colors.primary} />
          </View>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>Active</Text>
          </View>
        </View>

        {/* Info row — avatars + description */}
        <View style={s.squadInfoRow}>
          {/* Overlapping avatar stack */}
          <View style={s.avatarStack}>
            {SQUAD_AVATARS.map((a, i) => (
              <View
                key={i}
                style={[
                  s.squadAvatar,
                  {
                    backgroundColor: a.color,
                    marginLeft: i === 0 ? 0 : -10,
                    zIndex: SQUAD_AVATARS.length - i,
                  },
                ]}
              >
                <Text style={s.avatarInitial}>{a.initials}</Text>
              </View>
            ))}
            <View style={s.avatarCountBubble}>
              <Text style={s.avatarCountText}>+2</Text>
            </View>
          </View>

          <Text style={s.squadDesc}>
            <Text style={s.squadDescBold}>Live · </Text>
            3 students heading to Bondi
          </Text>
        </View>

        {/* CTA buttons */}
        <View style={s.squadBtnRow}>
          <TouchableOpacity style={s.joinBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.joinBtnGrad}
            >
              <Text style={s.joinBtnText}>Join Squad</Text>
              <ArrowRight size={15} color="#000" strokeWidth={2.8} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.laterBtn} activeOpacity={0.6}>
            <Text style={s.laterText}>Later</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── AI Search Bar ────────────────────────────────────────────────────────────

function AISearchBar() {
  const [query, setQuery] = useState('');

  return (
    <View style={s.searchWrapper}>
      {/* Glass container */}
      <View style={s.searchBar}>
        <TextInput
          style={s.searchInput}
          placeholder="Find somewhere quiet to study near USYD..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="send"
          multiline={false}
        />
        {/* Teal submit button */}
        <TouchableOpacity
          style={[s.searchSubmitBtn, query.length > 0 && s.searchSubmitBtnActive]}
          activeOpacity={0.8}
        >
          <Sparkles
            size={16}
            color={query.length > 0 ? '#000' : colors.primary}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>

      {/* Attribution */}
      <Text style={s.searchAttribution}>
        Powered by Aura AI · 7 international students nearby
      </Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function VibeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={s.screen} edges={['top']}>

      {/* ── Fixed header ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        {/* Close / X */}
        <TouchableOpacity
          style={s.closeBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.75}
        >
          <X size={18} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Title block */}
        <View style={s.headerTitles}>
          <Text style={s.headerTitle}>Find Your Vibe ✨</Text>
          <Text style={s.headerSub}>What's calling you today?</Text>
        </View>

        {/* Spacer to balance the X on the left */}
        <View style={s.closeBtn} />
      </View>

      {/* ── Scrollable list + sticky search bar ──────────────────────────── */}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={s.flex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          {/* ── Vibe cards ──────────────────────────────────────────────── */}
          <View style={s.cardList}>
            {VIBES.map(v => <VibeCard key={v.id} item={v} />)}
          </View>

          {/* ── Active Squad-Up card ─────────────────────────────────────── */}
          <SquadUpCard />

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── AI Search bar — sticks above keyboard ────────────────────── */}
        <AISearchBar />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex:   { flex: 1 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { alignItems: 'center', gap: 2 },
  headerTitle:  {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ── Card list
  scrollContent: { paddingBottom: 12 },
  cardList: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },

  // ── Vibe card
  vibeCardShell: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  // Teal ring when this vibe is the currently selected one
  vibeCardShellActive: {
    elevation: 12,
    shadowColor: '#2DD4BF',
    shadowOpacity: 0.55,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: '#2DD4BF',
  },
  vibeCardTouch: { borderRadius: 24 },
  // Checkmark shown instead of spots badge when active
  activeCheckWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
  },
  vibeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 14,
  },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  emojiText: { fontSize: 26 },
  vibeTextBlock: { flex: 1, gap: 3 },
  vibeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  vibeSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
  spotsBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 48,
  },
  spotsCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  spotsLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },

  // ── Squad-Up card
  squadCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    // Teal drop-shadow
    elevation: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  squadGlowBorder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.35)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  squadGrad: {
    padding: 18,
    gap: 14,
  },
  squadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  squadTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  squadTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '700',
  },
  squadInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  squadAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#151E1C',
  },
  avatarInitial: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  avatarCountBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: '#151E1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    zIndex: 0,
  },
  avatarCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  squadDesc: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  squadDescBold: {
    color: colors.success,
    fontWeight: '700',
  },
  squadBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  joinBtn: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  joinBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  joinBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.2,
  },
  laterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  laterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // ── AI Search bar
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
    gap: 7,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    // Glassmorphism inner glow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    paddingVertical: 7,
  },
  searchSubmitBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  searchSubmitBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  searchAttribution: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
