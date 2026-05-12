import { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Share,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
  Send,
  Zap,
} from 'lucide-react-native';
import { useUser } from '../hooks/useUser';
import { useTheme } from '../hooks/useTheme';
import { getLocationById, getTopMatch } from '../services/LocationService';
import { aiService }           from '../services/aiService';
import { useAuraIntelligence } from '../hooks/useAuraIntelligence';
import InsiderTip              from '../components/InsiderTip';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 260;

// Example questions shown before the user types anything
const EXAMPLE_QUESTIONS = [
  'Best time to visit?',
  'Is there a quiet spot for a Zoom call?',
  'Good for sunset?',
  'Any hidden areas locals use?',
];

// ─── Urgency pill ─────────────────────────────────────────────────────────────

function UrgencyPill({ label }) {
  const isLow = label === 'Scheduled' || label === 'Preventive';
  const bg  = isLow ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)';
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
  return (
    <View style={getStyles(colors).tagChip}>
      <Text style={getStyles(colors).tagChipText}>{label}</Text>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, title, colors }) {
  const s = getStyles(colors);
  return (
    <View style={s.sectionLabel}>
      <Icon size={14} color={colors.primary} strokeWidth={2} />
      <Text style={s.sectionLabelText}>{title}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LocationDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { wearableStats, userName, vibe, auraScore } = useUser();
  const { colors, isDark } = useTheme();
  const s = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  // ── Location data ────────────────────────────────────────────────────────
  const locationId = route.params?.locationId;
  const location   = locationId ? getLocationById(locationId) : getTopMatch();

  // ── AI Intelligence ──────────────────────────────────────────────────────
  const { matchScore, matchLabel, matchColor, reasoning, vibeLabel, vibeEmoji } =
    useAuraIntelligence(location);

  // ── Insider Tips ─────────────────────────────────────────────────────────
  const [tips,        setTips]        = useState([]);
  const [tipsLoading, setTipsLoading] = useState(true);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setTipsLoading(true);
    aiService.getInsiderTips(location.id, location.category)
      .then(data  => { if (!cancelled) setTips(data); })
      .catch(()   => {})
      .finally(() => { if (!cancelled) setTipsLoading(false); });
    return () => { cancelled = true; };
  }, [location?.id]);

  // ── Ask AURA Agent ───────────────────────────────────────────────────────
  const [question,   setQuestion]   = useState('');
  const [aiAnswer,   setAiAnswer]   = useState(null);
  const [isAsking,   setIsAsking]   = useState(false);
  const scrollRef = useRef(null);

  async function handleAsk(q) {
    const text = (q ?? question).trim();
    if (!text || isAsking) return;
    setQuestion('');
    setAiAnswer(null);
    setIsAsking(true);
    try {
      const answer = await aiService.askAgent({
        question: text,
        spotName: location?.name,
        vibe:     vibeLabel ?? vibe?.label,
        auraScore,
        userId:   userName ?? 'maya',
      });
      setAiAnswer(answer);
      // Scroll to bottom after answer renders
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 300);
    } catch {
      setAiAnswer('Sorry, the AURA Agent is temporarily unavailable. Try again shortly.');
    } finally {
      setIsAsking(false);
    }
  }

  // ── Share ────────────────────────────────────────────────────────────────
  const shareText =
    `Aura Alert — ${userName} has low sleep (${wearableStats?.sleepHours ?? '–'}h) ` +
    `and reduced activity today. Looking for a quiet environment to restore focus. ` +
    `Suggested location: ${location?.name} (${location?.address}).`;

  const handleShare = () =>
    Share.share({ message: shareText, title: 'Aura Recommendation' });

  if (!location) return null;

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>

      {/* ── Back button (floats over hero) ────────────────────────────────── */}
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <ArrowLeft size={18} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Hero image ──────────────────────────────────────────────────── */}
          <View style={s.heroWrap}>
            <Image source={{ uri: location.image }} style={s.heroImg} />
            <LinearGradient
              colors={['transparent', isDark ? 'rgba(10,14,18,0.9)' : 'rgba(0,0,0,0.6)', isDark ? '#0A0E12' : '#FFFFFF']}
              style={s.heroGrad}
            />
            <View style={s.heroContent}>
              <View style={s.heroTopRow}>
                {location.urgencyLabel && <UrgencyPill label={location.urgencyLabel} />}
                {/* Dynamic match score from useAuraIntelligence */}
                <View style={[s.aiMatchBadge, { borderColor: matchColor + '55', backgroundColor: matchColor + '22' }]}>
                  <Sparkles size={10} color={matchColor} strokeWidth={2} />
                  <Text style={[s.aiMatchText, { color: matchColor }]}>{matchScore}% {matchLabel}</Text>
                </View>
              </View>
              <Text style={s.heroTitle}>{location.name}</Text>
              <Text style={s.heroCategory}>{location.category}</Text>
            </View>
          </View>

          {/* ── Meta row ────────────────────────────────────────────────────── */}
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

          {/* ── Address ─────────────────────────────────────────────────────── */}
          <View style={s.addressRow}>
            <MapPin size={13} color={colors.textMuted} strokeWidth={2} />
            <Text style={s.addressText}>{location.address}</Text>
          </View>

          {/* ── Tags ────────────────────────────────────────────────────────── */}
          <View style={s.tagsRow}>
            {location.tags?.map(t => <TagChip key={t} label={t} />)}
          </View>

          {/* ── Cost card ───────────────────────────────────────────────────── */}
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

          {/* ── AI Summary card (existing) ───────────────────────────────────── */}
          <View style={s.aiCard}>
            <LinearGradient
              colors={isDark
                ? ['rgba(45,212,191,0.10)', 'rgba(14,165,233,0.06)', 'transparent']
                : ['rgba(45,212,191,0.05)', 'rgba(14,165,233,0.03)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.aiGrad}
            >
              <View style={s.aiHeader}>
                <Brain size={15} color={colors.primary} strokeWidth={2} />
                <Text style={s.aiTitle}>Aura AI Summary</Text>
                {/* Vibe context pill */}
                {vibeLabel && (
                  <View style={s.vibePill}>
                    <Text style={s.vibePillText}>{vibeEmoji} {vibeLabel}</Text>
                  </View>
                )}
              </View>

              <Text style={s.aiBody}>{location.aiSummary}</Text>

              {/* Reasoning line from useAuraIntelligence */}
              <Text style={s.reasoningText}>⚡ {reasoning}</Text>

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
                  <Text style={[s.aiStatNum, { color: matchColor }]}>{matchScore}%</Text>
                  <Text style={s.aiStatLabel}>Match</Text>
                </View>
              </View>

              {/* Share with Staff */}
              <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.82}>
                <Share2 size={14} color={colors.primary} strokeWidth={2.2} />
                <Text style={s.shareBtnText}>Share with Staff</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* ── Insider Tips section (new) ─────────────────────────────────── */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <View style={s.insiderSection}>
            <SectionLabel icon={Zap} title="Insider Tips" colors={colors} />
            <Text style={s.insiderSubtext}>RAG-retrieved from our Sydney lifestyle database</Text>

            {tipsLoading ? (
              <View style={s.tipsLoader}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={s.tipsLoaderText}>Retrieving local secrets…</Text>
              </View>
            ) : (
              <View style={s.tipsList}>
                {tips.map(tip => <InsiderTip key={tip.id} tip={tip} />)}
              </View>
            )}
          </View>

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* ── Ask the AURA Agent (new) ───────────────────────────────────── */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <View style={s.askSection}>

            <SectionLabel icon={Brain} title="Ask the AURA Agent" colors={colors} />
            <Text style={s.insiderSubtext}>
              Ask anything about this spot — powered by aura-brain-python RAG
            </Text>

            {/* Input row */}
            <View style={s.inputRow}>
              <TextInput
                style={s.askInput}
                value={question}
                onChangeText={setQuestion}
                placeholder="Is it good for sunset? Quiet Zoom spot?"
                placeholderTextColor={colors.textMuted}
                returnKeyType="send"
                onSubmitEditing={() => handleAsk()}
                editable={!isAsking}
                multiline={false}
              />
              <TouchableOpacity
                style={[s.sendBtn, (!question.trim() || isAsking) && s.sendBtnDisabled]}
                onPress={() => handleAsk()}
                disabled={!question.trim() || isAsking}
                activeOpacity={0.82}
              >
                {isAsking
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Send size={16} color="#000" strokeWidth={2.5} />
                }
              </TouchableOpacity>
            </View>

            {/* Example question chips — shown before first answer */}
            {!aiAnswer && !isAsking && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.examplesScroll}
              >
                {EXAMPLE_QUESTIONS.map(q => (
                  <TouchableOpacity
                    key={q}
                    style={s.exampleChip}
                    onPress={() => handleAsk(q)}
                    activeOpacity={0.75}
                  >
                    <Sparkles size={10} color={colors.primary} strokeWidth={2} />
                    <Text style={s.exampleChipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* AI answer card */}
            {isAsking && (
              <View style={s.thinkingRow}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={s.thinkingText}>AURA is thinking…</Text>
              </View>
            )}
            {aiAnswer && !isAsking && (
              <View style={s.answerWrap}>
                <InsiderTip
                  tip={{ id: 'agent-answer', text: aiAnswer, type: 'answer', confidence: 94 }}
                />
                {/* Allow follow-up */}
                <TouchableOpacity
                  style={s.followUpBtn}
                  onPress={() => { setAiAnswer(null); setQuestion(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.followUpText}>Ask another question</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
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
  heroImg:  { width, height: HERO_HEIGHT, resizeMode: 'cover' },
  heroGrad: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: HERO_HEIGHT * 0.72,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20, left: 16, right: 16,
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
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  aiMatchText: { fontSize: 11, fontWeight: '700' },
  heroTitle:    { fontSize: 26, fontWeight: '800', color: isDark ? '#fff' : '#000', letterSpacing: -0.4 },
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
  },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  metaText:    { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
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
  costHeader:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  costTitle:    { fontSize: 13, fontWeight: '800', color: colors.text },
  costBody:     { gap: 3 },
  costEstimate: { fontSize: 22, fontWeight: '800', color: colors.primary },
  costDetail:   { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

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
  aiGrad:  { padding: 18, gap: 12 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  aiTitle:  { fontSize: 13, fontWeight: '800', color: colors.text },
  vibePill: {
    backgroundColor: isDark ? 'rgba(45,212,191,0.12)' : 'rgba(45,212,191,0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.25)',
  },
  vibePillText:   { fontSize: 10, color: colors.primary, fontWeight: '700' },
  aiBody:         { fontSize: 14, color: colors.textSecondary, lineHeight: 22, fontWeight: '500' },
  reasoningText:  { fontSize: 12, color: colors.primary, fontWeight: '600', fontStyle: 'italic' },

  aiStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiStat:      { flex: 1, alignItems: 'center', gap: 2 },
  aiStatNum:   { fontSize: 15, fontWeight: '800', color: colors.text },
  aiStatLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  aiStatDiv:   { width: 1, height: 28, backgroundColor: colors.border },
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
  shareBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  // ── Section label
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  sectionLabelText: { fontSize: 15, fontWeight: '800', color: colors.text },

  // ── Insider Tips
  insiderSection: {
    marginHorizontal: 16,
    marginTop: 28,
    gap: 12,
  },
  insiderSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  tipsLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  tipsLoaderText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  tipsList: { gap: 10 },

  // ── Ask AURA Agent
  askSection: {
    marginHorizontal: 16,
    marginTop: 28,
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  askInput: {
    flex: 1,
    height: 48,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(45,212,191,0.3)' : 'rgba(45,212,191,0.2)',
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sendBtnDisabled: { opacity: 0.45, elevation: 0, shadowOpacity: 0 },

  // Example chips
  examplesScroll: { gap: 8 },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: isDark ? 'rgba(45,212,191,0.09)' : 'rgba(45,212,191,0.06)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.22)',
  },
  exampleChipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  // Thinking state
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  thinkingText: { fontSize: 13, color: colors.textMuted, fontWeight: '500', fontStyle: 'italic' },

  // Answer
  answerWrap: { gap: 10 },
  followUpBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  followUpText: { fontSize: 12, color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },

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
