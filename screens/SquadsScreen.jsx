import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  CalendarDays,
  Clock,
  Check,
  Users,
} from 'lucide-react-native';
import { colors } from '../constants/theme';
import { useUser } from '../context/UserContext';

// ─── Static data ─────────────────────────────────────────────────────────────

const ACTIVE_SQUADS = [
  {
    id:         '1',
    title:      'Bondi Beach Day',
    subtitle:   'Sunday beach day — all welcome!',
    spotsLeft:  5,
    startsIn:   'Today',
    day:        'Today',
    time:       '4:30 PM',
    category:   'Aussie Classics',
    tagColor:   '#0D9488',
    avatars:    ['#EF4444', '#8B5CF6', '#3B82F6'],
    extraCount: 12,
  },
  {
    id:         '2',
    title:      'Chinatown Food Tour',
    subtitle:   'Best dumplings & bubble tea near Haymarket',
    spotsLeft:  3,
    startsIn:   'Tonight',
    day:        'Tonight',
    time:       '6:30 PM',
    category:   "Bored & Broke",
    tagColor:   '#D97706',
    avatars:    ['#10B981', '#F97316', '#EC4899'],
    extraCount: 6,
  },
  {
    id:         '3',
    title:      'Botanic Garden Picnic',
    subtitle:   'Bring snacks, blankets & good vibes!',
    spotsLeft:  10,
    startsIn:   'Saturday',
    day:        'Saturday',
    time:       '17:00',
    category:   'Study Break',
    tagColor:   '#0EA5E9',
    avatars:    ['#14B8A6', '#A855F7', '#F43F5E'],
    extraCount: 8,
  },
];

const HISTORY = [
  { id: '1', icon: '📚', title: 'USYD Study Sesh',  members: 4, when: 'Last Tuesday' },
  { id: '2', icon: '⛴️', title: 'Manly Ferry Day',   members: 5, when: '2 days ago'   },
];

// ─── Live pulsing dot ─────────────────────────────────────────────────────────
//   The outer ring scale-animates from 1 → 2.4 and fades to 0 continuously,
//   giving the impression of a broadcast / radio-wave pulse.

function LiveDot() {
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim,   { toValue: 2.4, duration: 950, useNativeDriver: true }),
          Animated.timing(scaleAnim,   { toValue: 1,   duration: 0,   useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0,    duration: 950, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.65, duration: 0,   useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scaleAnim, opacityAnim]);

  return (
    <View style={s.liveDotContainer}>
      {/* Expanding ring */}
      <Animated.View
        style={[
          s.liveDotRing,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      />
      {/* Solid core */}
      <View style={s.liveDotCore} />
    </View>
  );
}

// ─── Avatar stack ─────────────────────────────────────────────────────────────
//   Overlaps circles using negative marginLeft on indices > 0.
//   zIndex = avatars.length - i keeps the leftmost avatar on top of the stack.

function AvatarStack({ avatars, extra = 0, cardBg = colors.surface }) {
  return (
    <View style={s.avatarStack}>
      {avatars.map((color, i) => (
        <View
          key={i}
          style={[
            s.stackAvatar,
            {
              backgroundColor: color,
              marginLeft:  i === 0 ? 0 : -10,
              zIndex:      avatars.length - i,
              borderColor: cardBg,
            },
          ]}
        />
      ))}
      {extra > 0 && (
        <View
          style={[
            s.stackExtra,
            { marginLeft: -10, borderColor: cardBg, zIndex: 0 },
          ]}
        >
          <Text style={s.stackExtraText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Active squad card ────────────────────────────────────────────────────────

function ActiveSquadCard({ item }) {
  const { isSquadJoined, joinSquad } = useUser();
  const joined = isSquadJoined(item.id);

  return (
    <View style={s.activeCard}>

      {/* Row 1 — title + spots-left badge + relative time ─────────────────── */}
      <View style={s.cardRow1}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={s.cardRow1Right}>
          <View style={s.spotsLeftPill}>
            <Text style={s.spotsLeftText}>{item.spotsLeft} left</Text>
          </View>
          <Text style={s.relTimeText}>{item.startsIn}</Text>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={s.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>

      {/* Thin divider */}
      <View style={s.cardDivider} />

      {/* Row 2 — date/time on left, avatar stack + join button on right ───── */}
      <View style={s.cardRow2}>

        {/* LEFT: date, time, category tag */}
        <View style={s.cardRow2Left}>
          <View style={s.dateRow}>
            <CalendarDays size={11} color={colors.textMuted} strokeWidth={2} />
            <Text style={s.dateText}>{item.day}</Text>
            <Text style={s.inlineDot}>·</Text>
            <Clock size={11} color={colors.textMuted} strokeWidth={2} />
            <Text style={s.timeText}>{item.time}</Text>
          </View>
          <View
            style={[
              s.categoryTag,
              {
                backgroundColor: item.tagColor + '1A',
                borderColor:     item.tagColor + '55',
              },
            ]}
          >
            <Text style={[s.categoryText, { color: item.tagColor }]}>
              {item.category}
            </Text>
          </View>
        </View>

        {/* RIGHT: avatar stack (Row 2 analog) + Join Squad button (Row 3 analog) */}
        <View style={s.cardRow2Right}>
          <AvatarStack
            avatars={item.avatars}
            extra={item.extraCount}
            cardBg={colors.surface}
          />
          {joined ? (
            <View style={[s.joinSquadBtn, s.joinSquadBtnDone]}>
              <View style={s.joinBtnGrad}>
                <Check size={13} color={colors.primary} strokeWidth={2.8} />
                <Text style={s.joinBtnTextDone}>Joined</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={s.joinSquadBtn}
              activeOpacity={0.82}
              onPress={() => joinSquad(item)}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.joinBtnGrad}
              >
                <Text style={s.joinBtnText}>Join Squad</Text>
                <Users size={13} color="#000" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── History item ─────────────────────────────────────────────────────────────

function HistoryCard({ item, isLast }) {
  return (
    <View style={[s.historyCard, !isLast && s.historyCardBorder]}>
      {/* Left: emoji icon + title + meta */}
      <View style={s.historyLeft}>
        <View style={s.historyIconWrap}>
          <Text style={s.historyIconText}>{item.icon}</Text>
        </View>
        <View style={s.historyTextBlock}>
          <Text style={s.historyTitle}>{item.title}</Text>
          <Text style={s.historyMeta}>
            {item.members} members · {item.when}
          </Text>
        </View>
      </View>

      {/* Right: Done badge */}
      <View style={s.doneBadge}>
        <Check size={11} color="#6B7280" strokeWidth={2.8} />
        <Text style={s.doneBadgeText}>Done</Text>
      </View>
    </View>
  );
}

// ─── Section header with optional right element ───────────────────────────────

function SectionHeader({ children, right }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionHeaderLeft}>{children}</View>
      {right && <View>{right}</View>}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SquadsScreen() {
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <View style={s.pageHeader}>
          <View style={s.pageHeaderLeft}>
            <Text style={s.pageMeta}>COMMUNITY</Text>
            <Text style={s.pageTitle}>Squads 🤙</Text>
            <View style={s.activeCountRow}>
              <View style={s.activeCountDot} />
              <Text style={s.activeCountText}>
                3 squads forming near you right now
              </Text>
            </View>
          </View>
          <TouchableOpacity style={s.createBtn} activeOpacity={0.82}>
            <Plus size={15} color="#000" strokeWidth={2.8} />
            <Text style={s.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* ── Active Now section ───────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader>
            <View style={s.liveSectionTitle}>
              <LiveDot />
              <Text style={s.sectionTitle}>Active Now</Text>
            </View>
          </SectionHeader>

          <View style={s.cardList}>
            {ACTIVE_SQUADS.map(squad => (
              <ActiveSquadCard key={squad.id} item={squad} />
            ))}
          </View>
        </View>

        {/* ── My History section ───────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader>
            <Text style={s.sectionTitle}>My History</Text>
          </SectionHeader>

          <View style={s.historyList}>
            {HISTORY.map((item, i) => (
              <HistoryCard
                key={item.id}
                item={item}
                isLast={i === HISTORY.length - 1}
              />
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 8 },

  // ── Page header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  pageHeaderLeft: { gap: 2 },
  pageMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.3,
    marginBottom: 1,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  activeCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeCountDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  activeCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 20,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },

  // ── Section layout
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionHeaderLeft: {},
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  liveSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // ── Pulsing live dot
  liveDotContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  liveDotCore: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    // Solid inner glow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Active squad cards list
  cardList: {
    paddingHorizontal: 16,
    gap: 14,
  },

  // ── Active squad card
  activeCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },

  // Row 1: title + badges
  cardRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    marginRight: 10,
  },
  cardRow1Right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  spotsLeftPill: {
    backgroundColor: 'rgba(56,189,248,0.14)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.32)',
  },
  spotsLeftText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '800',
  },
  relTimeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },

  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 14,
  },

  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 14,
  },

  // Row 2: date/time-left + avatars+button
  cardRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardRow2Left: {
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  inlineDot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Right column: avatar stack + join button
  cardRow2Right: {
    alignItems: 'flex-end',
    gap: 10,
  },

  // ── Avatar stack
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    // borderColor set dynamically from cardBg prop
  },
  stackExtra: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackExtraText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textSecondary,
  },

  // ── Join Squad button
  joinSquadBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    // Teal glow
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  joinBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.1,
  },
  joinSquadBtnDone: {
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: 'rgba(45,212,191,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    overflow: 'hidden',
  },
  joinBtnTextDone: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.1,
  },

  // ── History list
  historyList: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  historyCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyIconText: { fontSize: 20 },
  historyTextBlock: { gap: 3 },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  historyMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(107,114,128,0.12)',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(107,114,128,0.22)',
  },
  doneBadgeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
  },
});
