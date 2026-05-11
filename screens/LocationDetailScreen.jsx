import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  Brain,
  Share2,
  Sparkles,
  DollarSign,
  ShieldCheck,
} from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { getLocationById, getTopMatch } from '../services/LocationService';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 260;

// ─── Urgency pill ─────────────────────────────────────────────────────────────

function UrgencyPill({ label }) {
  const isLow = label === 'Scheduled' || label === 'Preventive';
  const bg = isLow ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)';
  const bdr = isLow ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)';
  const clr = isLow ? '#10B981' : '#F59E0B';
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <View style={[s.urgencyPill, { backgroundColor: bg, borderColor: bdr }]}>
      <ShieldCheck size={11} color={clr} strokeWidth={2.5} />
      <Text style={[s.urgencyText, { color: clr }]}>{label}</Text>
    </View>
  );
}

// ─── Tag chip ────────────────────────────────────────────────────────────────

function TagChip({ label }) {
  const { colors } = useTheme();
  const s = getStyles(colors);
  return (
    <View style={s.tagChip}>
      <Text style={s.tagChipText}>{label}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LocationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { wearableStats, userName } = useUser();
  const { colors, isDark } = useTheme();
  const s = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const locationId = route.params?.locationId;
  const location = locationId ? getLocationById(locationId) : getTopMatch();

  if (!location) return null;

  const shareText =
    `Aura Alert — ${userName} has low sleep (${wearableStats?.sleepHours ?? '–'}h) ` +
    `and reduced activity today. Looking for a quiet environment to restore focus. ` +
    `Suggested location: ${location.name} (${location.address}).`;

  const handleShare = () =>
    Share.share({ message: shareText, title: 'Aura Recommendation' });

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>

      {/* ── Back button (floats over hero) ─────────────────────────────────── */}
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <ArrowLeft size={18} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Hero image ─────────────────────────────────────────────────────── */}
        <View style={s.heroWrap}>
          <Image source={{ uri: location.image }} style={s.heroImg} />
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(10,14,18,0.9)' : 'rgba(0,0,0,0.6)', isDark ? '#0A0E12' : '#FFFFFF']}
            style={s.heroGrad}
          />
          {/* Hero overlay content */}
          <View style={s.heroContent}>
            <View style={s.heroTopRow}>
              <UrgencyPill label={location.urgencyLabel} />
              <View style={s.aiMatchBadge}>
                <Sparkles size={10} color={colors.primary} strokeWidth={2} />
                <Text style={s.aiMatchText}>{location.aiMatch}% match</Text>
              </View>
            </View>
            <Text style={s.heroTitle}>{location.name}</Text>
            <Text style={s.heroCategory}>{location.category}</Text>
          </View>
        </View>

        {/* ── Meta row ───────────────────────────────────────────────────────── */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Star size={13} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
            <Text style={s.metaText}>{location.rating}</Text>
          </View>
          <View style={s.metaDivider} />
          <View style={s.metaItem}>
            <MapPin size={13} color={colors.primary} strokeWidth={2.5} />
            <Text style={s.metaText}>{location.distance}</Text>
          </View>
          <View style={s.metaDivider} />
          <View style={s.metaItem}>
            <Clock size={13} color={colors.textSecondary} strokeWidth={2} />
            <Text style={s.metaText}>{location.hours}</Text>
          </View>
        </View>

        {/* ── Address ────────────────────────────────────────────────────────── */}
        <View style={s.addressRow}>
          <MapPin size={13} color={colors.textMuted} strokeWidth={2} />
          <Text style={s.addressText}>{location.address}</Text>
        </View>

        {/* ── Tags ───────────────────────────────────────────────────────────── */}
        <View style={s.tagsRow}>
          {location.tags.map((t) => <TagChip key={t} label={t} />)}
        </View>

        {/* ── Cost transparency card ─────────────────────────────────────────── */}
        <View style={s.costCard}>
          <View style={s.costHeader}>
            <DollarSign size={14} color={colors.primary} strokeWidth={2.5} />
            <Text style={s.costTitle}>Cost Transparency</Text>
          </View>
          <View style={s.costBody}>
            <Text style={s.costEstimate}>{location.costEstimate}</Text>
            <Text style={s.costDetail}>{location.costDetail}</Text>
          </View>
        </View>

        {/* ── AI Summary ─────────────────────────────────────────────────────── */}
        <View style={s.aiCard}>
          <LinearGradient
            colors={isDark ? ['rgba(45,212,191,0.10)', 'rgba(14,165,233,0.06)', 'transparent'] : ['rgba(45,212,191,0.05)', 'rgba(14,165,233,0.03)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.aiGrad}
          >
            <View style={s.aiHeader}>
              <Brain size={15} color={colors.primary} strokeWidth={2} />
              <Text style={s.aiTitle}>Aura AI Summary</Text>
            </View>

            <Text style={s.aiBody}>{location.aiSummary}</Text>

            {/* Wearable stats strip */}
            <View style={s.aiStatsRow}>
              <View style={s.aiStat}>
                <Text style={s.aiStatNum}>{wearableStats?.sleepHours ?? '–'}h</Text>
                <Text style={s.aiStatLabel}>Sleep</Text>
              </View>
              <View style={s.aiStatDiv} />
              <View style={s.aiStat}>
                <Text style={s.aiStatNum}>{wearableStats?.steps?.toLocaleString() ?? '–'}</Text>
                <Text style={s.aiStatLabel}>Steps</Text>
              </View>
              <View style={s.aiStatDiv} />
              <View style={s.aiStat}>
                <Text style={[s.aiStatNum, { color: colors.primary }]}>
                  {location.aiMatch}%
                </Text>
                <Text style={s.aiStatLabel}>AI Match</Text>
              </View>
            </View>

            {/* Share with Staff */}
            <TouchableOpacity
              style={s.shareBtn}
              onPress={handleShare}
              activeOpacity={0.82}
            >
              <Share2 size={14} color={colors.primary} strokeWidth={2.2} />
              <Text style={s.shareBtnText}>Share with Staff</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Footer CTA ─────────────────────────────────────────────────────── */}
      <View style={s.footer}>
        <TouchableOpacity
          style={s.goBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.goBtnGrad}
          >
            <MapPin size={16} color="#000" strokeWidth={2.5} />
            <Text style={s.goBtnText}>Set as Destination</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors = {}, isDark = false) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 0 },

  // ── Back button
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero
  heroWrap: { width, height: HERO_HEIGHT, position: 'relative' },
  heroImg: { width, height: HERO_HEIGHT, resizeMode: 'cover' },
  heroGrad: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: HERO_HEIGHT * 0.72,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    gap: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  urgencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  urgencyText: { fontSize: 11, fontWeight: '700' },

  aiMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(45,212,191,0.14)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
  },
  aiMatchText: { fontSize: 11, color: colors.primary, fontWeight: '700' },

  heroTitle: { fontSize: 26, fontWeight: '800', color: isDark ? '#fff' : '#000', letterSpacing: -0.4 },
  heroCategory: { fontSize: 13, color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)', fontWeight: '500' },

  // ── Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: -1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 0,
  },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  metaDivider: { width: 1, height: 20, backgroundColor: colors.border },

  // ── Address
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  addressText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  // ── Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tagChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  // ── Cost card
  costCard: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  costHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  costTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  costBody: { gap: 3 },
  costEstimate: { fontSize: 22, fontWeight: '800', color: colors.primary },
  costDetail: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  // ── AI Summary card
  aiCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(45,212,191,0.28)' : 'rgba(45,212,191,0.2)',
    elevation: 6,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  aiGrad: { padding: 18, gap: 12 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  aiTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  aiBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Stats strip inside AI card
  aiStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiStat: { flex: 1, alignItems: 'center', gap: 2 },
  aiStatNum: { fontSize: 15, fontWeight: '800', color: colors.text },
  aiStatLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  aiStatDiv: { width: 1, height: 28, backgroundColor: colors.border },

  // Share button
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 18,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(45,212,191,0.45)',
    backgroundColor: 'rgba(45,212,191,0.06)',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // ── Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  goBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  goBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  goBtnText: { fontSize: 15, fontWeight: '800', color: '#000' },
});
