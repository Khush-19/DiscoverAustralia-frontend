import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useUser } from '../hooks/useUser';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  ShieldCheck,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  MapPin,
  Pencil,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { AURA_HISTORY, getTrendPercentage } from '../services/TrendAnalysis';
import useFadeIn from '../hooks/useFadeIn';

// ─── Constants ────────────────────────────────────────────────────────────────

const AURA_MAX = 1000;

const AURA_BADGES = [
  {
    id: '1',
    label: 'Incognito',
    bg: 'rgba(0,0,0,0.32)',
    border: 'rgba(255,255,255,0.12)',
    color: '#9CA3AF',
  },
  {
    id: '2',
    label: 'Explorer',
    bg: 'rgba(45,212,191,0.18)',
    border: 'rgba(45,212,191,0.45)',
    color: '#2DD4BF',
  },
];

// Squads count is derived at render time — see ProfileScreen component below

// Badge definitions for experience levels (every 2000 points)
const EXPERIENCE_BADGES = [
  { id: '1', label: 'Bronze Explorer', emoji: '🥉', from: '#CD7F32', to: '#B87333', minScore: 2000 },
  { id: '2', label: 'Silver Adventurer', emoji: '🥈', from: '#C0C0C0', to: '#A8A8A8', minScore: 4000 },
  { id: '3', label: 'Gold Voyager', emoji: '🥇', from: '#FFD700', to: '#FFA500', minScore: 6000 },
  { id: '4', label: 'Platinum Legend', emoji: '💎', from: '#E5E4E2', to: '#B9F2FF', minScore: 8000 },
];

const SETTINGS_ITEMS = [
  { id: '1', Icon: Bell, label: 'Notifications', hint: 'Enabled' },
  { id: '2', Icon: ShieldCheck, label: 'Privacy & Safety', hint: 'Strong' },
  { id: '3', Icon: HelpCircle, label: 'Help & Support', hint: 'FAQs' },
  { id: '4', Icon: Settings, label: 'App Settings', hint: '' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

// 7-bar mini sparkline built from Views — no SVG dependency needed
function MiniSparkline({ history }) {
  const { colors } = useTheme();
  const s = getStyles(colors);
  const scores = history.map(d => d.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const pct = getTrendPercentage(history);
  const barColor = pct >= 0 ? colors.primary : '#EF4444';

  return (
    <View style={sp.wrap}>
      {scores.map((score, i) => {
        const heightPct = (score - min) / range;
        const barH = Math.max(4, Math.round(heightPct * 22));
        return (
          <View key={i} style={sp.barTrack}>
            <View style={[sp.bar, { height: barH, backgroundColor: barColor }]} />
          </View>
        );
      })}
    </View>
  );
}

const sp = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 26 },
  barTrack: { width: 5, height: 26, justifyContent: 'flex-end' },
  bar: { width: 5, borderRadius: 3 },
});

function SettingsRow({ Icon, label, hint, isLast, onPress }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <TouchableOpacity
      style={[s.settingRow, isLast && s.settingRowLast]}
      activeOpacity={0.65}
      onPress={onPress}
    >
      {/* Left — icon + label */}
      <View style={s.settingLeft}>
        <View style={s.settingIconWrap}>
          <Icon size={16} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={s.settingLabel}>{label}</Text>
      </View>

      {/* Right — hint + chevron */}
      <View style={s.settingRight}>
        {!!hint && <Text style={s.settingHint}>{hint}</Text>}
        <ChevronRight size={15} color={colors.textMuted} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { userName, auraScore, activeSquads, experienceData, updateExperienceData } = useUser();
  const { signOut, user, userToken } = useAuth();
  const { colors, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(colors), [colors]);
  const isFocused = useIsFocused();
  const [avatarUrl, setAvatarUrl] = React.useState(null);
  const [isNotificationEnabled, setIsNotificationEnabled] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (isFocused) {
      SecureStore.getItemAsync('discover_au_notification_enabled')
        .then(val => {
          if (val !== null) {
            setIsNotificationEnabled(val === 'true');
          } else {
            setIsNotificationEnabled(true);
          }
        })
        .catch(err => console.log('Error reading notifications settings:', err));
    }
  }, [isFocused]);

  React.useEffect(() => {
    if (isFocused && userToken) {
      let active = true;
      authService.getUserAvatar(userToken)
        .then(data => {
          if (active && data && data.url) {
            setAvatarUrl(data.url);
          }
        })
        .catch(err => {
          console.log('Error fetching avatar:', err);
        });
      return () => {
        active = false;
      };
    }
  }, [isFocused, userToken]);

  // Fetch experience level data when screen is focused
  React.useEffect(() => {
    if (isFocused && userToken) {
      let active = true;
      authService.getExperienceLevel(userToken)
        .then(data => {
          if (active && data) {
            updateExperienceData(data);
          }
        })
        .catch(err => {
          console.log('Error fetching experience level:', err);
        });
      return () => {
        active = false;
      };
    }
  }, [isFocused, userToken]);

  // Pull-to-refresh handler
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      userToken ? authService.getExperienceLevel(userToken).then(data => {
        if (data) updateExperienceData(data);
      }).catch(err => console.log('Error refreshing experience level:', err)) : Promise.resolve(),
      userToken ? authService.getUserAvatar(userToken).then(data => {
        if (data && data.url) setAvatarUrl(data.url);
      }).catch(err => console.log('Error refreshing avatar:', err)) : Promise.resolve(),
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [userToken, updateExperienceData]);

  const auraPct = auraScore / AURA_MAX;
  const trendPct = getTrendPercentage(AURA_HISTORY);
  const isUp = trendPct >= 0;
  const fadeStyle = useFadeIn();

  // Squad count and actions from API, with fallbacks
  const squadCount = experienceData.squadCount || activeSquads.length;
  const totalActions = experienceData.totalActivities || 0;
  
  // Calculate aura score from actions (each action = 600 points)
  const calculatedAuraScore = totalActions * 600;
  
  // Calculate level based on aura score (1 level = 1000 points)
  const currentLevel = Math.floor(calculatedAuraScore / 1000);
  
  // Calculate progress within current level (mod 1000)
  const progressInLevel = calculatedAuraScore % 1000;
  const auraPctCalculated = progressInLevel / 1000;

  const STATS = [
    { value: String(squadCount), label: 'Squads' },
    { value: String(totalActions), label: 'Actions' },
    { value: `Lv.${currentLevel}`, label: 'Level' },
  ];


  return (
    <Animated.View style={[{ flex: 1 }, fadeStyle]}>
      <SafeAreaView style={s.screen} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >

          {/* ── Page header ──────────────────────────────────────────────────── */}
          <View style={s.pageHeader}>
            <View>
              <Text style={s.pageMeta}>PROFILE</Text>
              <Text style={s.pageTitle}>{userName}'s Account</Text>
            </View>
          </View>

          {/* ── Profile card ─────────────────────────────────────────────────── */}
          <View style={s.profileCardShell}>
            <LinearGradient
              colors={['#0F9688', '#0D7A6E', '#0A5C53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.profileGrad}
            >
              {/* ── Top row: avatar + name/badge ─────────────────────────────── */}
              <View style={s.profileTopRow}>

                {/* Avatar with ring */}
                <View style={s.avatarRing}>
                  <Image
                    source={{ uri: avatarUrl || 'https://i.pravatar.cc/150?img=47' }}
                    style={s.avatarImg}
                  />
                </View>

                {/* Name + badge + edit ─────────────────────────────────── */}
                <View style={s.profileInfo}>
                  <View style={s.nameRow}>
                    <Text style={s.profileName}>{userName} ✨</Text>
                    <TouchableOpacity style={s.pencilBtn} activeOpacity={0.7}>
                      <Pencil size={12} color="rgba(255,255,255,0.75)" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  <View style={s.statusBadge}>
                    <MapPin size={10} color="#A7F3D0" strokeWidth={2.5} />
                    <Text style={s.statusBadgeText}>{user?.email || 'Explorer'}</Text>
                  </View>
                </View>
              </View>

              {/* ── Divider ──────────────────────────────────────────────────── */}
              <View style={s.cardDivider} />

              {/* ── Aura Score section ───────────────────────────────────────── */}
              <View style={s.auraSection}>
                {/* Label + numeric value with level multiplier */}
                <View style={s.auraTopRow}>
                  <Text style={s.auraLabel}>Score</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={s.auraValueText}>
                      <Text style={s.auraHighlight}>{progressInLevel}</Text>
                      <Text style={s.auraMax}> / 1000</Text>
                    </Text>
                    {currentLevel > 0 && (
                      <View style={s.levelMultiplierBadge}>
                        <Text style={s.levelMultiplierText}>x{currentLevel}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Progress track + teal glow fill */}
                <View style={s.progressTrack}>
                  {/* Glow layer — slightly wider + blurred behind the fill */}
                  <View
                    style={[
                      s.progressGlow,
                      { width: `${auraPctCalculated * 100}%` },
                    ]}
                  />
                  {/* Solid fill */}
                  <View style={[s.progressFill, { width: `${auraPctCalculated * 100}%` }]}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F0F0F0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ── Stats row ────────────────────────────────────────────────────── */}
          <View style={s.statsCard}>
            {STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
                {i < STATS.length - 1 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── Badges Earned ────────────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Badges Earned 🏅</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.badgeScroll}
            >
              {EXPERIENCE_BADGES.filter(badge => calculatedAuraScore >= badge.minScore).map(b => (
                <View key={b.id} style={s.badgeItem}>
                  <LinearGradient
                    colors={[b.from, b.to]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.badgeCircle}
                  >
                    <Text style={s.badgeEmoji}>{b.emoji}</Text>
                  </LinearGradient>
                  <Text style={s.badgeLabel}>{b.label}</Text>
                </View>
              ))}
              {EXPERIENCE_BADGES.filter(badge => calculatedAuraScore >= badge.minScore).length === 0 && (
                <View style={s.emptyBadgesContainer}>
                  <Text style={s.emptyBadgesText}>Earn badges by gaining aura score!</Text>
                  <Text style={s.emptyBadgesSubtext}>Every 2000 points unlocks a new badge</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* ── Settings ─────────────────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.settingsMeta}>SETTINGS</Text>
            <View style={s.settingsList}>
              {SETTINGS_ITEMS.map((item, i) => {
                let dynamicHint = item.hint;
                if (item.id === '1') {
                  dynamicHint = isNotificationEnabled ? 'Enabled' : 'Disabled';
                }

                return (
                  <SettingsRow
                    key={item.id}
                    Icon={item.Icon}
                    label={item.label}
                    hint={dynamicHint}
                    isLast={i === SETTINGS_ITEMS.length - 1}
                    onPress={() => {
                      if (item.id === '1') {
                        navigation.navigate('NotificationSettings');
                      } else if (item.id === '2') {
                        navigation.navigate('PersonalizedRecommendationSettings');
                      } else if (item.id === '3') {
                        navigation.navigate('Help');
                      } else if (item.id === '4') {
                        navigation.navigate('ThemeSettings');
                      }
                    }}
                  />
                );
              })}
            </View>
          </View>

          {/* ── Sign Out ─────────────────────────────────────────────────────── */}
          <TouchableOpacity style={s.signOutBtn} activeOpacity={0.75} onPress={signOut}>
            <LogOut size={16} color="#FCA5A5" strokeWidth={2.5} />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 16 },

  // ── Page header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  pageMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },

  // ── Profile card
  profileCardShell: {
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 14,
    // Card shadow
    elevation: 10,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
  },
  profileGrad: {
    padding: 20,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  pencilBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(167,243,208,0.3)',
  },
  statusBadgeText: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '600',
  },

  // ── Card divider
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 18,
    marginHorizontal: -4,
  },

  // ── Aura Score
  auraSection: { gap: 10 },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  trendBadgeUp: {
    backgroundColor: 'rgba(45,212,191,0.14)',
    borderColor: 'rgba(45,212,191,0.3)',
  },
  trendBadgeDown: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  trendBadgeText: { fontSize: 11, fontWeight: '700' },
  trendTextUp: { color: colors.primary },
  trendTextDown: { color: '#EF4444' },
  auraTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auraLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.4,
  },
  auraValueText: {},
  auraHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  auraMax: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  levelMultiplierBadge: {
    backgroundColor: 'rgba(251,146,60,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelMultiplierText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FB923C',
  },
  progressTrack: {
    height: 9,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    overflow: 'visible',
    position: 'relative',
  },
  progressGlow: {
    position: 'absolute',
    top: -4,
    left: 0,
    height: 17,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
    // iOS glow
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  auraBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  auraBadgePill: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  auraBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Stats card
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    // Subtle shadow
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
    backgroundColor: colors.border,
  },

  // ── Generic section wrapper
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  // ── Badges Earned
  badgeScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  badgeItem: {
    alignItems: 'center',
    gap: 8,
    width: 68,
  },
  badgeCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle inner glow ring
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  badgeEmoji: {
    fontSize: 26,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
  },
  emptyBadgesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyBadgesText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyBadgesSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // ── Settings
  settingsMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.4,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  settingsList: {
    marginHorizontal: 16,
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(45,212,191,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // ── Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FCA5A5',
    letterSpacing: 0.2,
  },
});

